import {
	AUTH_APP_DOMAIN,
	GALLERY_APP_BASE_URI,
	COGNITO_CLIENT_ID,
	COGNITO_BASE_URI,
	COGNITO_LOGIN_CALLBACK_URI,
	COGNITO_LOGOUT_CALLBACK_URI
} from './env';

/**
 * Root URL of the authentication web app, like https://auth.pix.tacocat.com
 */
export function getAuthAppBaseUrl(): string {
	return new URL('https://' + AUTH_APP_DOMAIN).toString();
}

/**
 * Root URL of the Tacocat photo gallery web app, like https://pix.tacocat.com
 */
export function getGalleryAppBaseUrl(): string {
	return new URL(GALLERY_APP_BASE_URI).toString();
}

/**
 * URL of the Cognito-hosted login page
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/login-endpoint.html
 */
export function getLoginUrl(): string {
	const url = new URL('/login', COGNITO_BASE_URI);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('client_id', COGNITO_CLIENT_ID);
	url.searchParams.set('redirect_uri', getLoginCallbackUrl());
	url.searchParams.set('scope', 'email openid phone');
	return url.toString();
}

/**
 * URL on the Tacocat web app to which Cognito is to return the user after 
 * they sign in via the Cognito-hosted login page.
 * 
 * Must be identical to an Allowed Callback URL configured in Cognito, 
 * inlucluding trailing slash.
 */
export function getLoginCallbackUrl(): string {
	return new URL(COGNITO_LOGIN_CALLBACK_URI, getAuthAppBaseUrl()).toString();
}

/**
 * URL of the Cognito-hosted logout functionality.
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/logout-endpoint.html
 */
export function getLogoutUrl(): string {
	const url = new URL('/logout', COGNITO_BASE_URI);
	url.searchParams.set('client_id', COGNITO_CLIENT_ID);
	url.searchParams.set('logout_uri', getLogoutCallbackUrl());
	return url.toString();
}

/**
 * URL to which Cognito is to return the user after they logout 
 * via the Cognito-hosted functionality.
 * 
 * Must be identical to an Allowed sign-out URL configured in Cognito, 
 * inlucluding trailing slash.
 */
export function getLogoutCallbackUrl(): string {
	return new URL(COGNITO_LOGOUT_CALLBACK_URI, getGalleryAppBaseUrl()).toString();
}
