/**
 * Returns whether the user is authenticated or not.
 *
 * Adapted from https://kinderas.com/technology/23/07/21/implementing-login-and-authentication-for-sveltekit-using-aws-cognito
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { CognitoJwtPayload } from 'aws-jwt-verify/jwt-model';
import { getCookie } from '../lib/cookies';
import { getTokensFromCognito, TokenExchangeError } from '../lib/authTokens';
import {
    ID_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    idTokenCookie,
    idTokenExpiry,
    refreshTokenCookie,
    wasAuthenticatedCookie,
} from '../lib/authCookies';
import { COGNITO_POOL_ID, COGNITO_CLIENT_ID, GALLERY_APP_DOMAIN } from '../lib/env';

// Module scope so the verifier's JWKS cache outlives the request: a verifier
// built per request would fetch Cognito's signing keys on every call.
const jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: COGNITO_POOL_ID,
    tokenUse: 'id',
    clientId: COGNITO_CLIENT_ID,
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // The response we'll be returning
    const response: APIGatewayProxyResult = {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {
            'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
            'Access-Control-Allow-Origin': `https://${GALLERY_APP_DOMAIN}`,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
            'cache-control': 'no-cache, no-store, must-revalidate',
            pragma: 'no-cache',
            expires: '0',
        },
        body: '',
    };

    // The user we'll be returning
    let user: { email: string } | undefined;

    // Get the cookie header from the API Gateway event
    const cookies = event.headers.cookie ?? '';

    // Get the short-lived Cognito user ID token from cookie
    const rawIdToken = getCookie(cookies, ID_TOKEN_COOKIE);

    // If ID token exists, try to validate it
    if (rawIdToken) {
        const idToken = await verifyToken(rawIdToken);
        user = idToken ? { email: idToken.email as string } : undefined;
    }

    // If we don't have a valid user yet (no id_token, or id_token was invalid/expired),
    // try to use the refresh token to get a new id_token
    if (!user) {
        const refreshToken = getCookie(cookies, REFRESH_TOKEN_COOKIE);

        if (refreshToken) {
            console.info({ event: 'token_refresh_attempt' });
            try {
                const updatedTokens = await getTokensFromCognito({ refreshToken: refreshToken });

                console.info({ event: 'token_refresh_success', rotated: !!updatedTokens.refresh_token });

                const idExpires = idTokenExpiry(updatedTokens.expires_in);
                const setCookies = [
                    idTokenCookie(updatedTokens.id_token, idExpires),
                    wasAuthenticatedCookie(idExpires),
                ];
                // With refresh token rotation on, Cognito revokes the token just
                // used and hands back a new one: keep it or the next refresh fails.
                if (updatedTokens.refresh_token) {
                    setCookies.push(refreshTokenCookie(updatedTokens.refresh_token));
                }
                response.multiValueHeaders = { 'Set-Cookie': setCookies };

                // Get user out of new ID token
                const idToken = await verifyToken(updatedTokens.id_token);
                user = idToken ? { email: idToken.email as string } : undefined;
            } catch (error) {
                // Cognito answers 400 when the refresh token has expired or been
                // revoked, which is a session ending normally, not an outage.
                const log = error instanceof TokenExchangeError && error.status === 400 ? console.warn : console.error;
                log({
                    event: 'token_refresh_error',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }

    if (!user) {
        response.statusCode = 401;
        response.body = JSON.stringify({ errorMessage: 'Unauthorized' });
    } else {
        response.statusCode = 200;
        response.body = JSON.stringify({ user });
    }

    console.info({
        event: 'auth_status_response',
        path: event.path,
        statusCode: response.statusCode,
        authenticated: !!user,
    });
    return response;
};

async function verifyToken(token: string): Promise<CognitoJwtPayload | undefined> {
    try {
        return await jwtVerifier.verify(token);
    } catch (error) {
        console.info({
            event: 'token_validation_failed',
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
}
