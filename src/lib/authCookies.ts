/*
    The cookies this app sets, in one place so every handler agrees on their
    names and attributes. A cookie can only be cleared by a Set-Cookie with the
    same name, Domain and Path, so the clear functions live beside the setters.
*/
import type { CookieOptions } from './cookies';
import { serializeCookie } from './cookies';

export const ID_TOKEN_COOKIE = 'id_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const WAS_AUTHENTICATED_COOKIE = 'was_authenticated';
export const OAUTH_STATE_COOKIE = 'oauth_state';
export const PKCE_VERIFIER_COOKIE = 'pkce_verifier';

// The gallery API on the sibling subdomain verifies the id token itself,
// so the token cookies span the parent domain.
const TOKEN_COOKIE_DOMAIN = 'tacocat.com';

// Cognito's refresh token validity, set in the user pool console, is 30 days.
// Expire the cookie just short of it so the cookie never outlives the token.
const REFRESH_TOKEN_COOKIE_DAYS = 29;

// How long a user gets between starting a login and Cognito calling back.
const LOGIN_ATTEMPT_MAX_AGE_SECONDS = 10 * 60;

const EPOCH = new Date(0);

const tokenCookieOptions: CookieOptions = {
    domain: TOKEN_COOKIE_DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
};

// Readable by the gallery's client-side script, so not HttpOnly
const hintCookieOptions: CookieOptions = { ...tokenCookieOptions, httpOnly: false };

// Host-only (no Domain) and scoped to the callback path, so the login secrets
// go nowhere else. Lax rather than Strict: the callback arrives as a top-level
// navigation redirected from Cognito, and when that redirect chain crosses
// sites (a federated identity provider, say) browsers withhold Strict cookies.
const loginAttemptCookieOptions: CookieOptions = {
    path: '/login_callback',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
};

export function idTokenExpiry(expiresInSeconds: number, now = new Date()): Date {
    return new Date(now.getTime() + expiresInSeconds * 1000);
}

export function idTokenCookie(idToken: string, expires: Date): string {
    return serializeCookie(ID_TOKEN_COOKIE, idToken, { ...tokenCookieOptions, expires });
}

export function refreshTokenCookie(refreshToken: string, now = new Date()): string {
    const expires = new Date(now);
    expires.setDate(expires.getDate() + REFRESH_TOKEN_COOKIE_DAYS);
    return serializeCookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...tokenCookieOptions, expires });
}

/**
 * Tells the gallery's client-side script that this browser MIGHT hold a
 * session, so it can skip calling the auth API when it plainly doesn't. The
 * token cookies are HttpOnly and so invisible to it; this one carries nothing
 * sensitive.
 */
export function wasAuthenticatedCookie(expires: Date, now = new Date()): string {
    return serializeCookie(WAS_AUTHENTICATED_COOKIE, `Authenticated at ${now.getTime()}`, {
        ...hintCookieOptions,
        expires,
    });
}

export function clearAuthCookies(): string[] {
    return [
        serializeCookie(ID_TOKEN_COOKIE, '', { ...tokenCookieOptions, expires: EPOCH }),
        serializeCookie(REFRESH_TOKEN_COOKIE, '', { ...tokenCookieOptions, expires: EPOCH }),
        serializeCookie(WAS_AUTHENTICATED_COOKIE, '', { ...hintCookieOptions, expires: EPOCH }),
    ];
}

export function loginAttemptCookies(state: string, codeVerifier: string): string[] {
    const options = { ...loginAttemptCookieOptions, maxAge: LOGIN_ATTEMPT_MAX_AGE_SECONDS };
    return [
        serializeCookie(OAUTH_STATE_COOKIE, state, options),
        serializeCookie(PKCE_VERIFIER_COOKIE, codeVerifier, options),
    ];
}

export function clearLoginAttemptCookies(): string[] {
    const options = { ...loginAttemptCookieOptions, maxAge: 0 };
    return [serializeCookie(OAUTH_STATE_COOKIE, '', options), serializeCookie(PKCE_VERIFIER_COOKIE, '', options)];
}
