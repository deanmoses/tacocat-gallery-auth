/*
    Log the user out.

    Deletes auth cookies and redirects to logout functionality hosted by
    AWS Cognito, which logs user out of Cognito.
*/
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getLogoutUrl } from '../lib/authUriHelpers';
import { clearAuthCookies } from '../lib/authCookies';

export const handler = (_event: APIGatewayProxyEvent): APIGatewayProxyResult => {
    console.info({ event: 'logout' });
    return {
        statusCode: 307,
        headers: { Location: getLogoutUrl() },
        multiValueHeaders: { 'Set-Cookie': clearAuthCookies() },
        body: '',
    };
};
