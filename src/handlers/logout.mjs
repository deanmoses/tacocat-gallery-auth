/*
    Log the user out.

    Deletes auth cookies and redirects to logout functionality hosted by 
    AWS Cognito, which logs user out of Cognito.
*/
import { getLogoutUrl } from 'commons/authUriHelpers.js';

export const handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`I only accept GET method, but instead I got: ${event.httpMethod}`);
    }

    // delete the cookies by setting an expires date in the past
    const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';

    return {
        statusCode: 307,
        headers: { Location: getLogoutUrl() },
        multiValueHeaders: {
            'Set-Cookie': [
                `id_token=; HttpOnly; Domain=tacocat.com; SameSite=Strict; Path=/; Expires=${expires}`,
                `refresh_token=; HttpOnly; Domain=tacocat.com; SameSite=Strict; Path=/; Expires=${expires}`,
                `was_authenticated=; Domain=tacocat.com; SameSite=Strict; Path=/; Expires=${expires}`
            ]
        }
    };
}