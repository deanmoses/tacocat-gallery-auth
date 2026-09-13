// The env module validates these at import time, so handlers can only be
// imported into a test once they exist.
process.env.CognitoBaseURI = 'https://login.example.com';
process.env.CognitoLogoutCallbackURI = '/';
process.env.CognitoUserPoolID = 'us-east-1_TestPool';
process.env.CognitoClientID = 'test-client-id';
process.env.CognitoClientSecret = 'test-client-secret';
process.env.GalleryAppBaseURI = 'https://gallery.example.com';
process.env.AuthAppDomain = 'auth.gallery.example.com';
process.env.GalleryAppDomain = 'gallery.example.com';
