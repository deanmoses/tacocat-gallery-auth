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
import type { Tokens } from '../lib/authTokens';
import { getTokensFromCognito, TokenExchangeError } from '../lib/authTokens';
import { getGalleryAppBaseUrl } from '../lib/authUriHelpers';
import {
    OAUTH_STATE_COOKIE,
    PKCE_VERIFIER_COOKIE,
    clearLoginAttemptCookies,
    idTokenCookie,
    idTokenExpiry,
    refreshTokenCookie,
    wasAuthenticatedCookie,
} from '../lib/authCookies';
import { getCookie } from '../lib/cookies';
import { secretsMatch } from '../lib/pkce';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const query = event.queryStringParameters ?? {};
    const cookies = event.headers.cookie ?? '';

    // Cognito reports a failed or abandoned sign-in as an error redirect
    if (query.error) {
        console.warn({ event: 'login_callback_denied', error: query.error, description: query.error_description });
        return errorResponse(400, 'Sign-in was not completed. Please try again.');
    }

    // Cognito passes a one-time authorization code and echoes back our state
    const { code, state } = query;
    if (!code || !state) {
        console.warn({ event: 'login_callback_error', error: 'Missing code or state query parameter' });
        return errorResponse(400, 'Invalid sign-in response.');
    }

    // The secrets minted at /login. Without them the callback is either a
    // forgery, a replay, or an attempt that outlived its cookies.
    const expectedState = getCookie(cookies, OAUTH_STATE_COOKIE);
    const codeVerifier = getCookie(cookies, PKCE_VERIFIER_COOKIE);
    if (!expectedState || !codeVerifier) {
        console.warn({ event: 'login_callback_error', error: 'No login attempt cookies' });
        return errorResponse(400, 'Sign-in attempt expired. Please try again.');
    }
    if (!secretsMatch(state, expectedState)) {
        console.warn({ event: 'login_callback_error', error: 'State mismatch' });
        return errorResponse(400, 'Invalid sign-in response.');
    }

    // Exchange the one-time code for a set of longer-lived auth tokens
    // id_token: short lived
    // refresh_token: longer lived
    let tokens: Tokens;
    try {
        tokens = await getTokensFromCognito({ code, codeVerifier });
    } catch (error) {
        console.error({
            event: 'login_callback_error',
            error: error instanceof Error ? error.message : String(error),
        });
        // Cognito answers 400 when the code is expired, reused or forged,
        // which is a client problem; anything else means Cognito is unwell.
        return error instanceof TokenExchangeError && error.status === 400
            ? errorResponse(400, 'Sign-in could not be completed. Please try again.')
            : errorResponse(502, 'Sign-in service unavailable. Please try again later.');
    }

    if (!tokens.access_token || !tokens.id_token || !tokens.refresh_token) {
        // Name the missing fields rather than logging the response: a partial
        // response may still carry live tokens, which must not reach CloudWatch.
        const missing = (['access_token', 'id_token', 'refresh_token'] as const).filter((field) => !tokens[field]);
        console.error({ event: 'login_callback_error', error: 'Unexpected token response', missing });
        return errorResponse(502, 'Authentication failed. Please try again.');
    }

    const idExpires = idTokenExpiry(tokens.expires_in);
    console.info({ event: 'login_success', idTokenExpires: idExpires.toISOString() });

    // Redirect to the home page of the Tacocat gallery web app
    return {
        statusCode: 307,
        headers: { Location: getGalleryAppBaseUrl() },
        multiValueHeaders: {
            'Set-Cookie': [
                idTokenCookie(tokens.id_token, idExpires),
                refreshTokenCookie(tokens.refresh_token),
                wasAuthenticatedCookie(idExpires),
                ...clearLoginAttemptCookies(),
            ],
        },
        body: '',
    };
};

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: message }),
    };
}
