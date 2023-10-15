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

import { getTokensFromCognito } from 'commons/authTokens.js';

export const handler = async (event) => {
    const code = event.queryStringParameters?.code;

    if (!code) {
		throw error(500, 'No code provided');
	}

    // Exchange the one-time code for a set of longer-lived auth tokens
	// id token: short lived
	// refresh token: longer lived
	let tokens = null;
	try {
		tokens = await getTokensFromCognito({ code });
	} catch (e) {
        throw error(500, JSON.stringify(e));
	}

    const response = {
        statusCode: 200,
        body: JSON.stringify({
            code: code,
            tokens: tokens
        })
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);

    return response;
}