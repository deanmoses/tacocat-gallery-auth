import { getTokensFromCognito, TokenExchangeError } from './authTokens';

const tokenResponse = { access_token: 'at', id_token: 'it', token_type: 'Bearer', expires_in: 3600 };

function mockFetch(status: number, body: unknown): jest.SpiedFunction<typeof fetch> {
    return jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
}

function sentBody(fetchMock: jest.SpiedFunction<typeof fetch>): URLSearchParams {
    const init = fetchMock.mock.calls[0]?.[1];
    return new URLSearchParams(init?.body as string);
}

describe('getTokensFromCognito', () => {
    afterEach(() => jest.restoreAllMocks());

    it('posts the authorization code with its PKCE verifier', async () => {
        const fetchMock = mockFetch(200, { ...tokenResponse, refresh_token: 'rt' });

        const tokens = await getTokensFromCognito({ code: 'the-code', codeVerifier: 'the-verifier' });

        expect(tokens.refresh_token).toBe('rt');
        expect(fetchMock.mock.calls[0]?.[0]).toBe('https://login.example.com/oauth2/token/');
        const body = sentBody(fetchMock);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('code')).toBe('the-code');
        expect(body.get('code_verifier')).toBe('the-verifier');
        expect(body.get('redirect_uri')).toBe('https://auth.gallery.example.com/login_callback');
        expect(body.get('refresh_token')).toBeNull();
    });

    it('posts the refresh token without a verifier', async () => {
        const fetchMock = mockFetch(200, tokenResponse);

        await getTokensFromCognito({ refreshToken: 'the-refresh' });

        const body = sentBody(fetchMock);
        expect(body.get('grant_type')).toBe('refresh_token');
        expect(body.get('refresh_token')).toBe('the-refresh');
        expect(body.get('code')).toBeNull();
        expect(body.get('code_verifier')).toBeNull();
    });

    it('authenticates the client with HTTP Basic', async () => {
        const fetchMock = mockFetch(200, tokenResponse);

        await getTokensFromCognito({ refreshToken: 'x' });

        const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
        expect(headers.Authorization).toBe(`Basic ${btoa('test-client-id:test-client-secret')}`);
    });

    it('throws a TokenExchangeError carrying the status on a non-2xx response', async () => {
        mockFetch(400, '{"error":"invalid_grant"}');

        const error = await getTokensFromCognito({ refreshToken: 'x' }).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(TokenExchangeError);
        expect((error as TokenExchangeError).status).toBe(400);
        expect((error as TokenExchangeError).message).toContain('invalid_grant');
    });
});
