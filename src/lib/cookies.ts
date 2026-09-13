/**
 * Get cookie value by name
 * @param name Name of the cookie
 * @returns cookie value or null if not found
 */
export function getCookie(cookieHeader: string, name: string): string | null {
    if (!cookieHeader) {
        return null;
    }
    const nameLenPlus = name.length + 1;
    return (
        cookieHeader
            .split(';')
            .map((c) => c.trim())
            .filter((cookie) => {
                return cookie.substring(0, nameLenPlus) === `${name}=`;
            })
            .map((cookie) => {
                return decodeURIComponent(cookie.substring(nameLenPlus));
            })[0] ?? null
    );
}

export interface CookieOptions {
    domain?: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Build a Set-Cookie header value. The value is not encoded: every cookie this
 * app sets holds a base64url or JWT string, which is already cookie-safe.
 */
export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
    const attributes: (string | false | undefined)[] = [
        options.domain && `Domain=${options.domain}`,
        options.path && `Path=${options.path}`,
        options.expires && `Expires=${options.expires.toUTCString()}`,
        options.maxAge !== undefined && `Max-Age=${options.maxAge}`,
        options.httpOnly && 'HttpOnly',
        options.secure && 'Secure',
        options.sameSite && `SameSite=${options.sameSite}`,
    ];
    return [`${name}=${value}`, ...attributes.filter((attribute) => !!attribute)].join('; ');
}
