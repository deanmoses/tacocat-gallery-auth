# tacocat-gallery-auth

Authentication API for [Tacocat Gallery](https://pix.tacocat.com) using AWS Cognito.

## What it does

Provides OAuth2 login flow with secure cookie-based token storage:
- `/login` - Redirects to Cognito-hosted UI
- `/login_callback` - Exchanges auth code for tokens, sets HttpOnly cookies
- `/` - Returns auth status, auto-refreshes expired tokens
- `/logout` - Clears cookies, redirects to Cognito logout

## Tech stack

AWS SAM, Lambda (Node.js 24), API Gateway, Cognito

## Development

```bash
npm install
npm test          # Run tests
npm run watch     # Sync changes to AWS (dev)
npm run tail      # Tail CloudWatch logs
```

## Deployment

- Push to `main` → deploys to staging (`auth.staging-pix.tacocat.com`)
- Manual workflow dispatch → deploys to prod (`auth.pix.tacocat.com`)

## See also

- [tacocat-gallery-sam](https://github.com/deanmoses/tacocat-gallery-sam) - The gallery app that uses this auth service
