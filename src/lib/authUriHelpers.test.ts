// Mock the env module
jest.mock('./env', () => ({
    AUTH_APP_DOMAIN: 'auth.no-such.domain.com',
    GALLERY_APP_BASE_URI: 'https://no-such.domain.com',
    COGNITO_BASE_URI: 'https://mock-pool.auth.us-east-1.amazoncognito.com',
    COGNITO_CLIENT_ID: 'mock-client-id',
    COGNITO_LOGIN_CALLBACK_URI: '/login_callback',
    COGNITO_LOGOUT_CALLBACK_URI: '/',
}));

import {
    getAuthAppBaseUrl,
    getGalleryAppBaseUrl,
    getLoginUrl,
    getLoginCallbackUrl,
    getLogoutUrl,
    getLogoutCallbackUrl,
} from './authUriHelpers';

describe('getAuthAppBaseUrl', () => {
    it('returns the auth app URL with https', () => {
        expect(getAuthAppBaseUrl()).toBe('https://auth.no-such.domain.com/');
    });
});

describe('getGalleryAppBaseUrl', () => {
    it('returns the gallery app URL', () => {
        expect(getGalleryAppBaseUrl()).toBe('https://no-such.domain.com/');
    });
});

describe('getLoginCallbackUrl', () => {
    it('returns the login callback URL on the auth domain', () => {
        expect(getLoginCallbackUrl()).toBe('https://auth.no-such.domain.com/login_callback');
    });
});

describe('getLogoutCallbackUrl', () => {
    it('returns the logout callback URL on the gallery domain', () => {
        expect(getLogoutCallbackUrl()).toBe('https://no-such.domain.com/');
    });
});

describe('getLoginUrl', () => {
    it('returns the Cognito authorize URL with correct query params', () => {
        const url = new URL(getLoginUrl({ state: 'the-state', codeChallenge: 'the-challenge' }));

        expect(url.origin).toBe('https://mock-pool.auth.us-east-1.amazoncognito.com');
        expect(url.pathname).toBe('/oauth2/authorize');
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('client_id')).toBe('mock-client-id');
        expect(url.searchParams.get('redirect_uri')).toBe('https://auth.no-such.domain.com/login_callback');
        expect(url.searchParams.get('scope')).toBe('email openid phone');
        expect(url.searchParams.get('state')).toBe('the-state');
        expect(url.searchParams.get('code_challenge')).toBe('the-challenge');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });
});

describe('getLogoutUrl', () => {
    it('returns the Cognito logout URL with correct query params', () => {
        const url = new URL(getLogoutUrl());

        expect(url.origin).toBe('https://mock-pool.auth.us-east-1.amazoncognito.com');
        expect(url.pathname).toBe('/logout');
        expect(url.searchParams.get('client_id')).toBe('mock-client-id');
        expect(url.searchParams.get('logout_uri')).toBe('https://no-such.domain.com/');
    });
});
