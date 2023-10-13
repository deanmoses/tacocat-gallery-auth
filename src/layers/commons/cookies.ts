

/**
 * Get cookie value by name
 * @param name Name of the cookie
 * @returns cookie value or null if not found
 */
export function getCookie(cookieHeader: string, name: string): string|null {
    if (!!cookieHeader) return null;
	const nameLenPlus = (name.length + 1);
	return cookieHeader
		.split(';')
		.map(c => c.trim())
		.filter(cookie => {
			return cookie.substring(0, nameLenPlus) === `${name}=`;
		})
		.map(cookie => {
			return decodeURIComponent(cookie.substring(nameLenPlus));
		})[0] || null;
}