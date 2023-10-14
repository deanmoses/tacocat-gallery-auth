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
import { COGNITO_POOL_ID, COGNITO_CLIENT_ID } from 'commons/cognitoConstants.js';

/**
 * The function called when the Lambda is invoked
 */
export const handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`I only accept GET method, but instead I got: ${event.httpMethod}`);
    }

    console.log('Event: ', event);

    const cookies = event.headers?.cookie;

    // Get the short-lived Cognito user ID token from cookie
    const rawIdToken = getCookie(cookies, 'id_token');
    console.log('Raw ID token cookie: ', rawIdToken);

    // Get the Cognito refresh token from cookie
    const refreshToken = getCookie(cookies, 'refresh_token');
    console.log('Refresh token cookie: ', refreshToken);

    const otherCookie = getCookie(cookies, 'other');
    console.log('Other cookie: ', otherCookie);

    const info = {
        email: "2mo@mo.com",
        idToken: rawIdToken,
        refreshToken: refreshToken,
        otherCookie: otherCookie,
        cookies,
        event
    }

    const response = {
        statusCode: 200,
        multiValueHeaders: {
            'Set-Cookie': ['other=doozit; HttpOnly; SameSite=Strict', 'id_token=I just made this up; HttpOnly; SameSite=Strict', 'yetOneMore=0U812; HttpOnly; SameSite=Strict']
        },
        body: JSON.stringify(info)
    };

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