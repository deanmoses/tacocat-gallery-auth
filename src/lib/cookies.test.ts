import { getCookie, serializeCookie } from './cookies';

describe('getCookie', () => {
    it('returns the value of an existing cookie', () => {
        const header = 'id_token=abc123; refresh_token=xyz789';
        expect(getCookie(header, 'id_token')).toBe('abc123');
        expect(getCookie(header, 'refresh_token')).toBe('xyz789');
    });

    it('returns null for a missing cookie', () => {
        const header = 'id_token=abc123';
        expect(getCookie(header, 'refresh_token')).toBeNull();
    });

    it('returns null for empty cookie header', () => {
        expect(getCookie('', 'id_token')).toBeNull();
    });

    it('returns null for undefined cookie header', () => {
        expect(getCookie(undefined as unknown as string, 'id_token')).toBeNull();
    });

    it('returns an empty string for a cookie with no value', () => {
        const header = 'id_token=; refresh_token=xyz789';
        expect(getCookie(header, 'id_token')).toBe('');
    });

    it('handles URL-encoded values', () => {
        const header = 'message=hello%20world';
        expect(getCookie(header, 'message')).toBe('hello world');
    });

    it('handles cookies with spaces around semicolons', () => {
        const header = 'id_token=abc123 ; refresh_token=xyz789';
        expect(getCookie(header, 'refresh_token')).toBe('xyz789');
    });

    it('does not match partial cookie names', () => {
        const header = 'id_token=abc123; id=short';
        expect(getCookie(header, 'id')).toBe('short');
        expect(getCookie(header, 'id_token')).toBe('abc123');
    });

    it('handles cookies with equals signs in the value', () => {
        const header = 'token=abc=123=xyz';
        expect(getCookie(header, 'token')).toBe('abc=123=xyz');
    });
});

describe('serializeCookie', () => {
    it('emits just name=value with no options', () => {
        expect(serializeCookie('a', 'b')).toBe('a=b');
    });

    it('emits every attribute', () => {
        expect(
            serializeCookie('id_token', 'tok', {
                domain: 'example.com',
                path: '/',
                expires: new Date(Date.UTC(2030, 0, 2, 3, 4, 5)),
                maxAge: 60,
                httpOnly: true,
                secure: true,
                sameSite: 'Lax',
            }),
        ).toBe(
            'id_token=tok; Domain=example.com; Path=/; Expires=Wed, 02 Jan 2030 03:04:05 GMT; Max-Age=60; HttpOnly; Secure; SameSite=Lax',
        );
    });

    it('emits Max-Age=0', () => {
        expect(serializeCookie('a', '', { maxAge: 0 })).toBe('a=; Max-Age=0');
    });

    it('omits false flags', () => {
        expect(serializeCookie('a', 'b', { httpOnly: false, secure: false })).toBe('a=b');
    });
});
