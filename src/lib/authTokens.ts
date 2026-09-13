/*
	Retrieves authorization tokens from AWS Cognito.
    
	Adapted from https://kinderas.com/technology/23/07/21/implementing-login-and-authentication-for-sveltekit-using-aws-cognito
*/

import { COGNITO_BASE_URI, COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET } from './env';
import { getLoginCallbackUrl } from './authUriHelpers';

export interface Tokens {
    access_token: string;
    id_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token?: string;
}

interface TokenPayload {
    grant_type: 'authorization_code' | 'refresh_token';
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    code?: string;
    code_verifier?: string;
    refresh_token?: string;
}

interface TokenOptionsCode {
    code: string;
    codeVerifier: string;
    refreshToken?: never;
}

interface TokenOptionsRefresh {
    code?: never;
    codeVerifier?: never;
    refreshToken: string;
}

type TokenOptions = TokenOptionsCode | TokenOptionsRefresh;

/** Cognito's token endpoint answered with an error status */
export class TokenExchangeError extends Error {
    readonly status: number;

    constructor(status: number, body: string) {
        super(`Cognito token exchange failed (${status}): ${body}`);
        this.name = 'TokenExchangeError';
        this.status = status;
    }
}

/**
 * This function retrieves authorization tokens from AWS Cognito.
 *
 * It can be used in two ways:
 * 1) Given a Cognito-provided one-time authorization code and the PKCE verifier
 *    minted when the login started, retrieve both a short-lived access/id token
 *    and longer-living refresh token.
 * 2) Given a Cognito-provided longer-living refresh token, update the short-lived
 *    access/id token. When the user pool rotates refresh tokens, the response
 *    also carries a new refresh token.
 *
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
 */
export async function getTokensFromCognito(options: TokenOptions): Promise<Tokens> {
    const baseUrl = COGNITO_BASE_URI;
    const clientId = COGNITO_CLIENT_ID;
    const clientSecret = COGNITO_CLIENT_SECRET;

    if (!clientSecret) {
        throw Error('No Cognito Client Secret in the environment');
    }

    // The token API endpoint
    const cognitoTokenExchangeUrl = new URL('/oauth2/token/', baseUrl);

    // The token API basic auth header value using the client ID and secret
    const authHeader = btoa(`${clientId}:${clientSecret}`);

    // The token API request body
    const bodyObj: TokenPayload = {
        // If a code is passed, use the authorization_code grant type.
        // If a refresh token is passed, use the refresh_token grant type.
        grant_type: options.code ? 'authorization_code' : 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getLoginCallbackUrl(),
    };

    // Add the code or refresh token to the body object depending on the options
    if (options.code) {
        bodyObj.code = options.code;
        bodyObj.code_verifier = options.codeVerifier;
    }
    if (options.refreshToken) {
        bodyObj.refresh_token = options.refreshToken;
    }

    // Serialize the body object to URL-encoded form data
    const body = new URLSearchParams(
        Object.entries(bodyObj).filter((entry): entry is [string, string] => entry[1] !== undefined),
    ).toString();

    // Make the request and return the response
    const response = await fetch(cognitoTokenExchangeUrl.toString(), {
        method: 'POST',
        headers: {
            // The headers as defined in the Cognito docs
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${authHeader}`,
        },
        body,
    });

    if (!response.ok) {
        throw new TokenExchangeError(response.status, await response.text());
    }

    return (await response.json()) as Tokens;
}
