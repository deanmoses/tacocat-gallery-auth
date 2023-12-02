export const COGNITO_BASE_URI = getEnv('CognitoBaseURI');
export const COGNITO_LOGIN_CALLBACK_URI = '/login_callback';
export const COGNITO_LOGOUT_CALLBACK_URI = getEnv('CognitoLogoutCallbackURI');
export const COGNITO_POOL_ID = getEnv('CognitoUserPoolID');
export const COGNITO_CLIENT_ID = getEnv('CognitoClientID');
export const COGNITO_CLIENT_SECRET = getEnv('CognitoClientSecret');
export const GALLERY_APP_BASE_URI = getEnv('GalleryAppBaseURI');
export const AUTH_APP_DOMAIN = getEnv('AuthAppDomain');
export const GALLERY_APP_DOMAIN= getEnv('GalleryAppDomain');

function getEnv(environmentVarName: string): string {
    const environmentVarValue = process.env[environmentVarName];
    if (!environmentVarValue) {
        throw Error('No value for environment variable [' + environmentVarName + ']');
    }
    return environmentVarValue;
}