import { getCookie } from './cookies';

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
