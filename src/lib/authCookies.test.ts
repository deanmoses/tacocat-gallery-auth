import {
    clearAuthCookies,
    clearLoginAttemptCookies,
    idTokenCookie,
    idTokenExpiry,
    loginAttemptCookies,
    refreshTokenCookie,
    wasAuthenticatedCookie,
} from './authCookies';

const now = new Date(Date.UTC(2030, 0, 1, 0, 0, 0));

describe('idTokenExpiry', () => {
    it('adds expires_in seconds to now', () => {
        expect(idTokenExpiry(3600, now).toISOString()).toBe('2030-01-01T01:00:00.000Z');
    });
});

describe('token cookies', () => {
    it('id token is HttpOnly, Secure, Strict on the parent domain', () => {
        expect(idTokenCookie('tok', idTokenExpiry(3600, now))).toBe(
            'id_token=tok; Domain=tacocat.com; Path=/; Expires=Tue, 01 Jan 2030 01:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
        );
    });

    it('refresh token lasts 29 days', () => {
        expect(refreshTokenCookie('rt', now)).toBe(
            'refresh_token=rt; Domain=tacocat.com; Path=/; Expires=Wed, 30 Jan 2030 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
        );
    });

    it('was_authenticated hint is readable by script', () => {
        const cookie = wasAuthenticatedCookie(idTokenExpiry(3600, now), now);
        expect(cookie).toBe(
            `was_authenticated=Authenticated at ${now.getTime()}; Domain=tacocat.com; Path=/; Expires=Tue, 01 Jan 2030 01:00:00 GMT; Secure; SameSite=Strict`,
        );
        expect(cookie).not.toContain('HttpOnly');
    });

    it('clears all three with matching Domain and Path', () => {
        const cleared = clearAuthCookies();
        expect(cleared).toHaveLength(3);
        for (const cookie of cleared) {
            expect(cookie).toMatch(
                /^(id_token|refresh_token|was_authenticated)=; Domain=tacocat\.com; Path=\/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; /,
            );
            expect(cookie).toContain('Secure');
        }
    });
});

describe('login attempt cookies', () => {
    it('are host-only, Lax, scoped to the callback path, and short-lived', () => {
        expect(loginAttemptCookies('st', 'ver')).toEqual([
            'oauth_state=st; Path=/login_callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax',
            'pkce_verifier=ver; Path=/login_callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax',
        ]);
    });

    it('clear with the same Path', () => {
        expect(clearLoginAttemptCookies()).toEqual([
            'oauth_state=; Path=/login_callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
            'pkce_verifier=; Path=/login_callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
        ]);
    });
});
