import { getSomething } from 'commons';

/**
 * 
 */
export const authStatusHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`authStatusHandler only accept GET method, you tried: ${event.httpMethod}`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);
    console.log('Cookies:', event.headers?.Cookie);

    const user = {
        email: "mo@mo.com",
        cookies: event.headers?.Cookie,
        test: getSomething()
    }

    const response = {
        statusCode: 200,
        headers: {
            'Set-Cookie': 'now=doozit; HttpOnly; SameSite=Strict',
        },
        body: JSON.stringify(user)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
