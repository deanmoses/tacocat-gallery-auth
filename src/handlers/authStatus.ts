/**
 * This is a Lambda function.
 *
 * Returns whether the user is authenticated or not
 *
 * This handles checking authentication status with AWS Cognito.
 *
 * Adapted from https://kinderas.com/technology/23/07/21/implementing-login-and-authentication-for-sveltekit-using-aws-cognito
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { CognitoJwtPayload } from 'aws-jwt-verify/jwt-model';
import { getCookie } from '../lib/cookies';
import { getTokensFromCognito } from '../lib/authTokens';
import { COGNITO_POOL_ID, COGNITO_CLIENT_ID, GALLERY_APP_DOMAIN } from '../lib/env';

/**
 * The function called when the Lambda is invoked
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`I only accept GET method, but instead I got: ${event.httpMethod}`);
    }

	// The response we'll be returning
	const response: APIGatewayProxyResult = {
		statusCode: 200,
		isBase64Encoded: false,
		headers: {
			"Access-Control-Allow-Headers" : "X-Requested-With,Content-Type",
			"Access-Control-Allow-Origin": `https://${GALLERY_APP_DOMAIN}`,
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Credentials": "true",
			'cache-control': 'no-cache, no-store, must-revalidate',
			pragma: 'no-cache',
			expires: '0',
		},
		body: ''
	}

	// The user we'll be returning
    let user: { email: string } | undefined;

    // Get the cookie header from the API Gateway event
    const cookies = event.headers.cookie ?? '';

    // Get the short-lived Cognito user ID token from cookie
    const rawIdToken = getCookie(cookies, 'id_token');

    // If ID token exists, try to validate it
	if (rawIdToken) {
		const idToken = await verifyToken(rawIdToken);
		user = idToken ? { email: idToken.email as string } : undefined;
	}

	// If we don't have a valid user yet (no id_token, or id_token was invalid/expired),
	// try to use the refresh token to get a new id_token
	if (!user) {
		const refreshToken = getCookie(cookies, 'refresh_token');

		if (refreshToken) {
			console.log(JSON.stringify({ event: 'token_refresh_attempt', message: 'Attempting to refresh tokens' }));
			try {
				const updatedTokens = await getTokensFromCognito({ refreshToken: refreshToken });

				console.log(JSON.stringify({ event: 'token_refresh_success', message: 'Got updated tokens from Cognito' }));

				// Update the cookie for the id token
				const idExpires = new Date();
				idExpires.setSeconds(idExpires.getSeconds() + updatedTokens.expires_in);
				response.multiValueHeaders = {
					'Set-Cookie': [
						`id_token=${updatedTokens.id_token}; HttpOnly; Secure; Domain=tacocat.com; SameSite=Strict; Path=/; Expires=${idExpires.toUTCString()}`,
						`was_authenticated=Authenticated at ${Date.now()}; Secure; Domain=tacocat.com; SameSite=Strict; Path=/; Expires=${idExpires.toUTCString()}`
					]
				}

				// Get user out of new ID token
				const idToken = await verifyToken(updatedTokens.id_token);
				user = idToken ? { email: idToken.email as string } : undefined;
			} catch (error) {
				// If the refresh token is invalid, treat user as not logged in
				console.error(JSON.stringify({ event: 'token_refresh_error', error: error instanceof Error ? error.message : String(error) }));
			}
		}
	}

	if (!user) {
		response.statusCode = 401;
		response.body = JSON.stringify({errorMessage: 'Unauthorized'})
	}
	else {
		response.statusCode = 200;
		response.body = JSON.stringify({user})
	}

    // All log statements are written to CloudWatch
    console.info(JSON.stringify({ event: 'auth_status_response', path: event.path, statusCode: response.statusCode, authenticated: !!user }));
    return response;
}


/**
 * Verify the JWT token
 */
async function verifyToken(token: string): Promise<CognitoJwtPayload | undefined> {
	const jwtVerifier = CognitoJwtVerifier.create({
		userPoolId: COGNITO_POOL_ID,
		tokenUse: 'id',
		clientId: COGNITO_CLIENT_ID
	});
	let payload;
	try {
		payload = await jwtVerifier.verify(token);
	} catch (error) {
		console.log(JSON.stringify({ event: 'token_validation_failed', error: error instanceof Error ? error.message : String(error) }));
	}
	return payload;
}
