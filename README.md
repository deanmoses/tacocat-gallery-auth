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

Requires Node 24 (see `.nvmrc`).

```bash
npm install
npm test          # Run tests
npm run lint      # ESLint; see package.json for the other lint and format scripts
npm run watch     # Sync changes to AWS (dev)
npm run tail      # Tail CloudWatch logs
```

## Deployment

- Push to `main` → deploys to staging (`auth.staging-pix.tacocat.com`)
- Manual workflow dispatch → deploys to prod (`auth.pix.tacocat.com`). The `prod` GitHub environment requires a reviewer, so open the run and click _Review deployments_ to let it proceed.

CI never holds AWS keys. Each workflow job exchanges its GitHub OIDC token for a short-lived AWS role scoped to what that job does; see [infra/README.md](infra/README.md).

## See also

- [tacocat-gallery-sam](https://github.com/deanmoses/tacocat-gallery-sam) - The gallery app that uses this auth service
