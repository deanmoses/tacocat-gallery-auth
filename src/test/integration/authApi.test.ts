/*
    Black-box checks against a deployed auth API, staging by default. They
    need no credentials: everything here is reachable logged out. What they
    prove that unit tests cannot is the deployed wiring: the pool and client
    IDs the verifier was built with, that Cognito accepts the authorize
    request this API constructs, and the CORS origin the stack was given.
*/
import { codeChallenge } from '../../lib/pkce';
import { getCookie } from '../../lib/cookies';

const AUTH_API_URL = new URL(String(process.env.AUTH_API_URL));

function get(path: string, init: { cookie?: string } = {}): Promise<Response> {
    return fetch(new URL(path, AUTH_API_URL), {
        redirect: 'manual',
        headers: init.cookie === undefined ? {} : { cookie: init.cookie },
    });
}

function setCookies(response: Response): string[] {
    return response.headers.getSetCookie();
}

function cookieNamed(response: Response, name: string): string | undefined {
    return setCookies(response).find((cookie) => cookie.startsWith(`${name}=`));
}

/** A well-formed but unsigned JWT for the configured pool: the verifier has to consult the JWKS to reject it */
function unsignedIdToken(): string {
    const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');
    const header = encode({ alg: 'RS256', kid: 'no-such-key' });
    const payload = encode({ iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_DdPFtamLz', exp: 4102444800 });
    return `${header}.${payload}.${encode({})}`;
}

describe('GET /', () => {
    it('is 401 with CORS and no-cache headers when logged out', async () => {
        const response = await get('/');

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ errorMessage: 'Unauthorized' });
        expect(response.headers.get('access-control-allow-origin')).toBe(
            `https://${AUTH_API_URL.hostname.replace(/^auth\./, '')}`,
        );
        expect(response.headers.get('access-control-allow-credentials')).toBe('true');
        expect(response.headers.get('cache-control')).toContain('no-store');
    });

    it('is 401 for an id token that is not a JWT', async () => {
        const response = await get('/', { cookie: 'id_token=not-a-jwt' });
        expect(response.status).toBe(401);
    });

    it('is 401 for an unsigned id token', async () => {
        const response = await get('/', { cookie: `id_token=${unsignedIdToken()}` });
        expect(response.status).toBe(401);
        expect(setCookies(response)).toEqual([]);
    });

    it('is 401 for a bogus refresh token', async () => {
        const response = await get('/', { cookie: 'refresh_token=not-a-refresh-token' });
        expect(response.status).toBe(401);
        expect(setCookies(response)).toEqual([]);
    });
});

describe('GET /login', () => {
    it('redirects to Cognito with PKCE and state that match the cookies it sets', async () => {
        const response = await get('/login');

        expect(response.status).toBe(302);
        const location = new URL(String(response.headers.get('location')));
        expect(location.pathname).toBe('/oauth2/authorize');
        expect(location.searchParams.get('response_type')).toBe('code');
        expect(location.searchParams.get('code_challenge_method')).toBe('S256');
        expect(location.searchParams.get('redirect_uri')).toBe(new URL('/login_callback', AUTH_API_URL).toString());

        const stateCookie = cookieNamed(response, 'oauth_state');
        const verifierCookie = cookieNamed(response, 'pkce_verifier');
        expect(stateCookie).toMatch(/; Path=\/login_callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax$/);
        expect(verifierCookie).toMatch(/; Path=\/login_callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax$/);

        const cookies = setCookies(response).join('; ');
        expect(location.searchParams.get('state')).toBe(getCookie(cookies, 'oauth_state'));
        expect(location.searchParams.get('code_challenge')).toBe(
            codeChallenge(String(getCookie(cookies, 'pkce_verifier'))),
        );
    });

    it('builds an authorize request that Cognito accepts', async () => {
        // Cognito answers a bad client_id, redirect_uri or PKCE parameter with an error page, not a login page
        const redirect = await get('/login');
        const cognito = await fetch(String(redirect.headers.get('location')), { redirect: 'follow' });

        expect(cognito.status).toBe(200);
        expect(await cognito.text()).not.toMatch(/An error was encountered/i);
    });
});

describe('GET /login_callback', () => {
    it('is 400 with no query string', async () => {
        const response = await get('/login_callback');
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: expect.any(String) as string });
    });

    it('is 400 when the login attempt cookies are missing', async () => {
        const response = await get('/login_callback?code=abc&state=xyz');
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: expect.stringMatching(/expired/) as string });
    });

    it('is 400 when the state does not match the cookie', async () => {
        const response = await get('/login_callback?code=abc&state=xyz', {
            cookie: 'oauth_state=other; pkce_verifier=whatever',
        });
        expect(response.status).toBe(400);
    });

    it('is 400 when Cognito reports an error', async () => {
        const response = await get('/login_callback?error=access_denied');
        expect(response.status).toBe(400);
    });

    it('is 400, not 502, when Cognito rejects the code', async () => {
        const response = await get('/login_callback?code=not-a-real-code&state=xyz', {
            cookie: 'oauth_state=xyz; pkce_verifier=not-the-real-verifier',
        });
        expect(response.status).toBe(400);
        expect(setCookies(response)).toEqual([]);
    });
});

describe('GET /logout', () => {
    it('clears the session cookies and redirects to Cognito logout', async () => {
        const response = await get('/logout');

        expect(response.status).toBe(307);
        const location = new URL(String(response.headers.get('location')));
        expect(location.pathname).toBe('/logout');
        expect(location.searchParams.get('logout_uri')).toBe(
            `https://${AUTH_API_URL.hostname.replace(/^auth\./, '')}/`,
        );
        for (const name of ['id_token', 'refresh_token', 'was_authenticated']) {
            expect(cookieNamed(response, name)).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
        }
    });
});
