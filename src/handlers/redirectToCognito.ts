/*
    Starts a login by redirecting to the Cognito-hosted login page.

    We *could* avoid this redirect by hard-coding the URL to the
    Cognito-hosted login page into the client, but doing it
    server-side allows us to periodically rotate the Cognito app client
    credentials, which is generally required for security compliance,
    without the need to release a new version of client (even though
    web application does not need installation, it still require a
    change to its client artifacts on server side).

    It also mints the per-attempt secrets (OAuth state and PKCE verifier) and
    parks them in cookies for the callback to check.
*/
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getLoginUrl } from '../lib/authUriHelpers';
import { loginAttemptCookies } from '../lib/authCookies';
import { codeChallenge, generateCodeVerifier, generateState } from '../lib/pkce';

export const handler = (_event: APIGatewayProxyEvent): APIGatewayProxyResult => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    console.info({ event: 'login_redirect' });
    return {
        statusCode: 302,
        headers: {
            Location: getLoginUrl({ state, codeChallenge: codeChallenge(codeVerifier) }),
            'Cache-Control': 'no-store',
        },
        multiValueHeaders: { 'Set-Cookie': loginAttemptCookies(state, codeVerifier) },
        body: '',
    };
};
