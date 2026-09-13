import { handler } from './logout';
import { apiGatewayEvent, setCookies } from '../testing/apiGatewayEvent';

describe('logout handler', () => {
    it('clears the session cookies and redirects to Cognito logout', () => {
        jest.spyOn(console, 'info').mockImplementation(() => undefined);

        const result = handler(apiGatewayEvent({ path: '/logout' }));

        expect(result.statusCode).toBe(307);
        const url = new URL(String(result.headers?.Location));
        expect(url.pathname).toBe('/logout');
        expect(url.searchParams.get('logout_uri')).toBe('https://gallery.example.com/');
        expect(setCookies(result).map((c) => c.split('=')[0])).toEqual([
            'id_token',
            'refresh_token',
            'was_authenticated',
        ]);
    });
});
