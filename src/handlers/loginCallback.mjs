export const handler = async (event) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            event
        })
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);

    return response;
}