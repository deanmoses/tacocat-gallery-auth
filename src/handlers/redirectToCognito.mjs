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
import { getLoginUrl } from 'commons/authUriHelpers.js';

/**
 * The function called when the Lambda is invoked
 */
export const handler = async (event) => {
    console.log("Login URL: ", getLoginUrl());
    return {
        statusCode: 302,
        headers: { Location: getLoginUrl() }
    };
}
