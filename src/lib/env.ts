// Required environment variables
const requiredEnvVars = [
	'CognitoBaseURI',
	'CognitoLogoutCallbackURI',
	'CognitoUserPoolID',
	'CognitoClientID',
	'CognitoClientSecret',
	'GalleryAppBaseURI',
	'AuthAppDomain',
	'GalleryAppDomain'
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

// Validate all required environment variables at startup
const missing = requiredEnvVars.filter(name => !process.env[name]);
if (missing.length > 0) {
	throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Helper to get validated env var (we know it exists after validation above)
function getEnv(name: RequiredEnvVar): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Environment variable ${name} is not set`);
	}
	return value;
}

// Export validated environment variables
export const COGNITO_BASE_URI = getEnv('CognitoBaseURI');
export const COGNITO_LOGIN_CALLBACK_URI = '/login_callback';
export const COGNITO_LOGOUT_CALLBACK_URI = getEnv('CognitoLogoutCallbackURI');
export const COGNITO_POOL_ID = getEnv('CognitoUserPoolID');
export const COGNITO_CLIENT_ID = getEnv('CognitoClientID');
export const COGNITO_CLIENT_SECRET = getEnv('CognitoClientSecret');
export const GALLERY_APP_BASE_URI = getEnv('GalleryAppBaseURI');
export const AUTH_APP_DOMAIN = getEnv('AuthAppDomain');
export const GALLERY_APP_DOMAIN = getEnv('GalleryAppDomain');
