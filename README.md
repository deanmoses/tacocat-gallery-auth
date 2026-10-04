# tacocat-gallery-auth

> **Archived.** This repo was the Cognito login for [pix.tacocat.com](https://pix.tacocat.com) on AWS from December 2023 to October 2026. On 2026-10-02 the gallery moved to Cloudflare and now lives in [tacocat-gallery-cloudflare](https://github.com/deanmoses/tacocat-gallery-cloudflare), where a passkey login replaces Cognito. Nothing here deploys any more; the stacks are out of service and being torn down. The last production release was `2026v5`; `main` is two commits past it that never shipped. The user pool was configured by hand in the console, so its settings are exported under [docs/archive/cognito](docs/archive/cognito/README.md) for the record.

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
- Manual workflow dispatch → deploys to prod (`auth.pix.tacocat.com`)

CI never holds AWS keys. Each workflow job exchanges its GitHub OIDC token for a short-lived AWS role scoped to what that job does; see [infra/README.md](infra/README.md).

## See also

- [tacocat-gallery-sam](https://github.com/deanmoses/tacocat-gallery-sam) - The gallery app that uses this auth service
