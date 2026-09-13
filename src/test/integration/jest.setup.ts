// Two network hops per test at most, but Cognito's login page can be slow to render
jest.setTimeout(30_000);

process.env.AUTH_API_URL ??= 'https://auth.staging-pix.tacocat.com';
