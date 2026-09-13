import type { APIGatewayProxyEvent } from 'aws-lambda';

/** A GET event with only the fields the handlers read filled in */
export function apiGatewayEvent(
    overrides: { path?: string; cookie?: string; query?: Record<string, string> } = {},
): APIGatewayProxyEvent {
    return {
        httpMethod: 'GET',
        path: overrides.path ?? '/',
        headers: overrides.cookie === undefined ? {} : { cookie: overrides.cookie },
        multiValueHeaders: {},
        queryStringParameters: overrides.query ?? null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        body: null,
        isBase64Encoded: false,
        resource: overrides.path ?? '/',
        requestContext: {} as APIGatewayProxyEvent['requestContext'],
    };
}

export function setCookies(result: {
    multiValueHeaders?: Record<string, (string | number | boolean)[]> | undefined;
}): string[] {
    return (result.multiValueHeaders?.['Set-Cookie'] ?? []).map(String);
}
