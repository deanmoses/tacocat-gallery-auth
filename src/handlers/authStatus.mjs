/**
 * This is a Lambda function.
 * 
 * Returns whether the user is authenticated or not
 * 
 * This handles checking authentication status with AWS Cognito.
 * 
 * Adapted from https://kinderas.com/technology/23/07/21/implementing-login-and-authentication-for-sveltekit-using-aws-cognito
 */

import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { getCookie } from 'commons/cookies.js';
import { getTokensFromCognito } from 'commons/authTokens.js';
import { COGNITO_POOL_ID, COGNITO_CLIENT_ID } from 'commons/env.js';

/**
 * The function called when the Lambda is invoked
 */
export const handler = async (event) => {
    console.info(event);

    if (event.httpMethod !== 'GET') {
        throw new Error(`I only accept GET method, but instead I got: ${event.httpMethod}`);
    }

    let response = {};
    let user;

    // Get the cookie header from the API Gateway event
    const cookies = event.headers?.cookie;

    // Get the short-lived Cognito user ID token from cookie
    const rawIdToken = getCookie(cookies, 'id_token');

    // If ID token exists, user is logged in
	if (rawIdToken) {
		// Parse and validate the ID token
		const idToken = await verifyToken(rawIdToken);
		user = { email: idToken?.email };
	}
	// If if no short-lived Cognito ID token, see if we have a longer-lived Cognito refresh token
	else {
        // Get the Cognito refresh token from cookie
        const refreshToken = getCookie(cookies, 'refresh_token');

		// If the refresh token doesn't exist, user is not logged in
		// If the refresh token DOES exist, try to get a new short-lived ID token
		if (refreshToken) {
			try {
				// Try to update the tokens
				const updatedTokens = await getTokensFromCognito({ refreshToken: refreshToken });

				// Update the cookie for the id token
				const idExpires = new Date();
				idExpires.setSeconds(idExpires.getSeconds() + updatedTokens.expires_in);
                response.multiValueHeaders = {
                    'Set-Cookie': [
                        `id_token=${updatedTokens.id_token}; HttpOnly; SameSite=Strict; Path=/; Expires=${idExpires}`
                    ]
                }

				// Get user out of new ID token
				const idToken = await verifyToken(updatedTokens.id_token);
				user = { email: idToken.email };
			} catch (error) {
				// If the refresh token is invalid, treat user as not logged in
				console.log('Authentication status error: ' + error);
			}
		}
	}

    const body = {
        email: "9mo@mo.com",
        idToken: rawIdToken,
        user,
        cookies,
        event
    }

    response.statusCode = 200;
    response.body = JSON.stringify(body)

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}


/**
 * Verify the JWT token
 */
async function verifyToken(token) {
	const jwtVerifier = CognitoJwtVerifier.create({
		userPoolId: COGNITO_POOL_ID,
		tokenUse: 'id',
		clientId: COGNITO_CLIENT_ID
	});
	let payload;
	try {
		payload = await jwtVerifier.verify(token);
	} catch {
		console.log('Token not valid!');
	}
	return payload;
}