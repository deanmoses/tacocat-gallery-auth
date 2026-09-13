import { handler } from './redirectToCognito';
import { codeChallenge } from '../lib/pkce';
import { getCookie } from '../lib/cookies';
import { apiGatewayEvent, setCookies } from '../testing/apiGatewayEvent';

describe('redirectToCognito handler', () => {
    it('redirects to Cognito with state and PKCE challenge that match the cookies it sets', () => {
        const result = handler(apiGatewayEvent({ path: '/login' }));

        expect(result.statusCode).toBe(302);
        const url = new URL(String(result.headers?.Location));
        expect(url.origin).toBe('https://login.example.com');
        expect(url.pathname).toBe('/oauth2/authorize');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');

        const cookies = setCookies(result).join('; ');
        const state = getCookie(cookies, 'oauth_state');
        const verifier = getCookie(cookies, 'pkce_verifier');
        expect(state).toBeTruthy();
        expect(verifier).toBeTruthy();
        expect(url.searchParams.get('state')).toBe(state);
        expect(url.searchParams.get('code_challenge')).toBe(codeChallenge(String(verifier)));
    });

    it('mints fresh secrets per request', () => {
        const first = new URL(String(handler(apiGatewayEvent()).headers?.Location));
        const second = new URL(String(handler(apiGatewayEvent()).headers?.Location));
        expect(first.searchParams.get('state')).not.toBe(second.searchParams.get('state'));
        expect(first.searchParams.get('code_challenge')).not.toBe(second.searchParams.get('code_challenge'));
    });
});
