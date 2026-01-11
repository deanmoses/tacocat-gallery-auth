/**
 * Handle the authentication callback from Cognito, after the user
 * has signed in via the Cognito-hosted login UI.
 *
 * Adapted from https://kinderas.com/technology/23/07/21/implementing-login-and-authentication-for-sveltekit-using-aws-cognito
 *
 * This stores the refresh token as a cookie.
 * You might have heard that it's a bad idea to a store refresh token
 * locally on the user's machine. This is true, unless you have a
 * revocation strategy, as Cognito does.  Refresh tokens can be
 * invalidated at any point in Cognito (via the api or by logging the
 * user out), And, with short lived access and id tokens the refresh
 * token will be validated by Cognito whenever new access and id tokens
 * are requested.
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getTokensFromCognito } from '../lib/authTokens';
import { getGalleryAppBaseUrl } from '../lib/authUriHelpers';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Cognito passes a one-time authorization code via a query string parameter called `code`
    const code = event.queryStringParameters?.code;

    if (!code) {
		throw new Error('No Cognito code query parameter provided');
	}

    // Exchange the one-time code for a set of longer-lived auth tokens
	// id_token: short lived
	// refresh_token: longer lived
	let tokens = null;
	try {
		tokens = await getTokensFromCognito({ code });
	} catch (e) {
        throw new Error(`Token exchange failed: ${e instanceof Error ? e.message : String(e)}`);
	}

	// Store the id token and the refresh token in cookies
	if (tokens.access_token && tokens.id_token && tokens.refresh_token) {
        // Set the expire time for the id token
		const idExpires = new Date();
		idExpires.setSeconds(idExpires.getSeconds() + tokens.expires_in);

		// Set the expire time for the refresh token
		// This is set in the Cognito console to 30 days by default so we'll use 29 days here.
		// When the refresh token expires, the user will have to log in again.
		const refreshExpire = new Date();
		refreshExpire.setDate(refreshExpire.getDate() + 29);

        // Create the cookie headers
        const multiValueHeaders = {
            'Set-Cookie': [
                `id_token=${tokens.id_token}; HttpOnly; Secure; Domain=tacocat.com; SameSite=Strict; Path=/; Expires=${idExpires.toUTCString()}`,
                `refresh_token=${tokens.refresh_token}; HttpOnly; Secure; Domain=tacocat.com; SameSite=Strict; Path=/; Expires=${refreshExpire.toUTCString()}`,
                // Set another cookie that simply tells the front end we are dealing with
                // a user that MIGHT be authenticatable.  This is an optimization:
                // Cookies with secure info (like a session ID) should be set as
                // HttpOnly, meaning they can only be accessed server-side and not by
                // client scripts.  This prevents them from being stolen by malicious scripts.
                // Therefore, if I want the client to be able to short-circuit the logic
                // and only call the authentication back end if there's an actual chance
                // the user might be authenticated, I need to set another cookie with
                // no sensitive information.
                `was_authenticated=Authenticated at ${Date.now()}; Secure; Domain=tacocat.com; SameSite=Strict; Path=/; Expires=${idExpires.toUTCString()}`
            ]
        }

		console.info(JSON.stringify({ event: 'login_success', idTokenExpires: idExpires.toISOString() }));

		// Redirect to the home page of the Tacocat gallery web app
        return {
            statusCode: 307,
            multiValueHeaders,
            headers: { Location: getGalleryAppBaseUrl() },
            body: ''
        };

	} else {
        // If the response from Cognito doesn't have the stuff we expect,
        // log the full response for debugging but return a generic error to the client
        console.error(JSON.stringify({ event: 'login_callback_error', error: 'Unexpected token response', tokens }));
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Authentication failed. Please try again.' })
        }
	}
}
