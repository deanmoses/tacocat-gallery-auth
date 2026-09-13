const mockVerify = jest.fn();
const mockCreate = jest.fn(() => ({ verify: (token: string): unknown => mockVerify(token) }));
jest.mock('aws-jwt-verify', () => ({ CognitoJwtVerifier: { create: (): unknown => mockCreate() } }));
jest.mock('../lib/authTokens', () => ({
    ...jest.requireActual<typeof import('../lib/authTokens')>('../lib/authTokens'),
    getTokensFromCognito: jest.fn(),
}));

import { handler } from './authStatus';
import { getTokensFromCognito, TokenExchangeError } from '../lib/authTokens';
import { apiGatewayEvent, setCookies } from '../testing/apiGatewayEvent';

const getTokens = jest.mocked(getTokensFromCognito);
const refreshed = { access_token: 'at', id_token: 'new-id', token_type: 'Bearer' as const, expires_in: 3600 };

describe('authStatus handler', () => {
    beforeEach(() => {
        jest.spyOn(console, 'info').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    it('does not build a verifier per request', async () => {
        // clearMocks wiped the module-load call, so any call seen here is per request
        mockVerify.mockResolvedValue({ email: 'a@example.com' });
        await handler(apiGatewayEvent({ cookie: 'id_token=x' }));
        await handler(apiGatewayEvent({ cookie: 'id_token=y' }));
        expect(mockCreate).not.toHaveBeenCalled();
        expect(mockVerify).toHaveBeenCalledTimes(2);
    });

    it('returns the user for a valid id token without refreshing', async () => {
        mockVerify.mockResolvedValue({ email: 'a@example.com' });

        const result = await handler(apiGatewayEvent({ cookie: 'id_token=x; refresh_token=r' }));

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({ user: { email: 'a@example.com' } });
        expect(getTokens).not.toHaveBeenCalled();
        expect(setCookies(result)).toEqual([]);
    });

    it('returns 401 with no cookies', async () => {
        const result = await handler(apiGatewayEvent());
        expect(result.statusCode).toBe(401);
        expect(mockVerify).not.toHaveBeenCalled();
    });

    it('refreshes an expired id token and sets only the id and hint cookies when not rotated', async () => {
        mockVerify.mockRejectedValueOnce(new Error('expired')).mockResolvedValueOnce({ email: 'a@example.com' });
        getTokens.mockResolvedValue(refreshed);

        const result = await handler(apiGatewayEvent({ cookie: 'id_token=old; refresh_token=r' }));

        expect(result.statusCode).toBe(200);
        expect(getTokens).toHaveBeenCalledWith({ refreshToken: 'r' });
        expect(setCookies(result).map((c) => c.split('=')[0])).toEqual(['id_token', 'was_authenticated']);
    });

    it('stores the new refresh token when Cognito rotates it', async () => {
        mockVerify.mockRejectedValueOnce(new Error('expired')).mockResolvedValueOnce({ email: 'a@example.com' });
        getTokens.mockResolvedValue({ ...refreshed, refresh_token: 'rotated' });

        const result = await handler(apiGatewayEvent({ cookie: 'id_token=old; refresh_token=r' }));

        const cookies = setCookies(result);
        expect(cookies.map((c) => c.split('=')[0])).toEqual(['id_token', 'was_authenticated', 'refresh_token']);
        expect(cookies[2]).toMatch(/^refresh_token=rotated; /);
    });

    it('returns 401 and warns, not errors, when Cognito rejects the refresh token', async () => {
        getTokens.mockRejectedValue(new TokenExchangeError(400, '{"error":"invalid_grant"}'));

        const result = await handler(apiGatewayEvent({ cookie: 'refresh_token=r' }));

        expect(result.statusCode).toBe(401);
        expect(setCookies(result)).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(expect.objectContaining({ event: 'token_refresh_error' }));
        expect(console.error).not.toHaveBeenCalled();
    });

    it('returns 401 and logs an error when Cognito is unwell', async () => {
        getTokens.mockRejectedValue(new TokenExchangeError(503, 'Service Unavailable'));

        const result = await handler(apiGatewayEvent({ cookie: 'refresh_token=r' }));

        expect(result.statusCode).toBe(401);
        expect(console.error).toHaveBeenCalledWith(expect.objectContaining({ event: 'token_refresh_error' }));
    });
});
