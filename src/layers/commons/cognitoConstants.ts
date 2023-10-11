export const COGNITO_BASE_URI = getEnv('CognitoBaseURI');
export const COGNITO_LOGIN_CALLBACK_URI = getEnv('CognitoLoginCallbackURI');
export const COGNITO_LOGOUT_CALLBACK_URI = getEnv('CognitoLogoutCallbackURI');
export const COGNITO_POOL_ID = getEnv('CognitoUserPoolID');
export const COGNITO_CLIENT_ID = getEnv('CognitoClientID');
export const COGNITO_CLIENT_SECRET = "";
export const WEB_APP_BASE_URI = getEnv('WebAppBaseURI');
export const AUTH_APP_DOMAIN = getEnv('AuthAppDomain');

function getEnv(environmentVarName: string): string {
    const environmentVarValue = process.env[environmentVarName];
    if (!environmentVarValue) {
        throw Error('No value for environment variable [' + environmentVarName + ']');
    }
    return environmentVarValue;
}