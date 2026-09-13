jest.mock('../lib/authTokens', () => ({
    ...jest.requireActual<typeof import('../lib/authTokens')>('../lib/authTokens'),
    getTokensFromCognito: jest.fn(),
}));

import { handler } from './loginCallback';
import { getTokensFromCognito, TokenExchangeError } from '../lib/authTokens';
import { apiGatewayEvent, setCookies } from '../testing/apiGatewayEvent';

const getTokens = jest.mocked(getTokensFromCognito);
const attemptCookie = 'oauth_state=good-state; pkce_verifier=the-verifier';
const goodQuery = { code: 'the-code', state: 'good-state' };
const tokens = {
    access_token: 'at',
    id_token: 'it',
    refresh_token: 'rt',
    token_type: 'Bearer' as const,
    expires_in: 3600,
};

function body(result: { body: string }): { error?: string } {
    return JSON.parse(result.body) as { error?: string };
}

describe('loginCallback handler', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        jest.spyOn(console, 'info').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    it('exchanges the code with the verifier and sets the session cookies', async () => {
        getTokens.mockResolvedValue(tokens);

        const result = await handler(apiGatewayEvent({ query: goodQuery, cookie: attemptCookie }));

        expect(result.statusCode).toBe(307);
        expect(result.headers?.Location).toBe('https://gallery.example.com/');
        expect(getTokens).toHaveBeenCalledWith({ code: 'the-code', codeVerifier: 'the-verifier' });
        const cookies = setCookies(result);
        expect(cookies.map((c) => c.split('=')[0])).toEqual([
            'id_token',
            'refresh_token',
            'was_authenticated',
            'oauth_state',
            'pkce_verifier',
        ]);
        expect(cookies[0]).toMatch(/^id_token=it; /);
        expect(cookies[1]).toMatch(/^refresh_token=rt; /);
        expect(cookies[3]).toMatch(/^oauth_state=; .*Max-Age=0/);
        expect(cookies[4]).toMatch(/^pkce_verifier=; .*Max-Age=0/);
    });

    it('returns 400 when Cognito reports an error', async () => {
        const result = await handler(
            apiGatewayEvent({ query: { error: 'access_denied', error_description: 'nope' }, cookie: attemptCookie }),
        );

        expect(result.statusCode).toBe(400);
        expect(body(result).error).toBeDefined();
        expect(getTokens).not.toHaveBeenCalled();
    });

    it('returns 400 when code or state is missing', async () => {
        expect(
            (await handler(apiGatewayEvent({ query: { state: 'good-state' }, cookie: attemptCookie }))).statusCode,
        ).toBe(400);
        expect(
            (await handler(apiGatewayEvent({ query: { code: 'the-code' }, cookie: attemptCookie }))).statusCode,
        ).toBe(400);
        expect((await handler(apiGatewayEvent({ cookie: attemptCookie }))).statusCode).toBe(400);
        expect(getTokens).not.toHaveBeenCalled();
    });

    it('returns 400 when the login attempt cookies are missing', async () => {
        const result = await handler(apiGatewayEvent({ query: goodQuery }));

        expect(result.statusCode).toBe(400);
        expect(body(result).error).toMatch(/expired/);
        expect(getTokens).not.toHaveBeenCalled();
    });

    it('returns 400 when the state does not match the cookie', async () => {
        const result = await handler(
            apiGatewayEvent({ query: { code: 'the-code', state: 'other-state' }, cookie: attemptCookie }),
        );

        expect(result.statusCode).toBe(400);
        expect(getTokens).not.toHaveBeenCalled();
    });

    it('returns 400 when Cognito rejects the code', async () => {
        getTokens.mockRejectedValue(new TokenExchangeError(400, '{"error":"invalid_grant"}'));

        const result = await handler(apiGatewayEvent({ query: goodQuery, cookie: attemptCookie }));

        expect(result.statusCode).toBe(400);
        expect(setCookies(result)).toEqual([]);
    });

    it('returns 502 when Cognito is unavailable', async () => {
        getTokens.mockRejectedValue(new TokenExchangeError(503, 'down'));
        expect((await handler(apiGatewayEvent({ query: goodQuery, cookie: attemptCookie }))).statusCode).toBe(502);

        getTokens.mockRejectedValue(new TypeError('fetch failed'));
        expect((await handler(apiGatewayEvent({ query: goodQuery, cookie: attemptCookie }))).statusCode).toBe(502);
    });

    it('returns 502 when the token response is missing fields', async () => {
        getTokens.mockResolvedValue({ access_token: 'at', id_token: 'it', token_type: 'Bearer', expires_in: 3600 });

        const result = await handler(apiGatewayEvent({ query: goodQuery, cookie: attemptCookie }));

        expect(result.statusCode).toBe(502);
        expect(setCookies(result)).toEqual([]);
    });
});
