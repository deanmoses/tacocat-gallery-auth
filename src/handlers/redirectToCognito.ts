/*
    This is a Lambda function.

    Redirects to login page hosted by AWS Cognito.

    We *could* avoid this redirect by hard-coding the URL to the
    Cognito-hosted login page into the client, but doing it
    server-side allows us to periodically rotate the Cognito app client
    credentials, which is generally required for security compliance,
    without the need to release a new version of client (even though
    web application does not need installation, it still require a
    change to its client artifacts on server side).
*/
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getLoginUrl } from '../lib/authUriHelpers';

/**
 * The function called when the Lambda is invoked
 */
export const handler = (_event: APIGatewayProxyEvent): APIGatewayProxyResult => {
    const loginUrl = getLoginUrl();
    console.log(JSON.stringify({ event: 'login_redirect', loginUrl }));
    return {
        statusCode: 302,
        headers: { Location: loginUrl },
        body: ''
    };
}
