# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS Serverless authentication API for Tacocat Gallery using AWS Cognito. Provides OAuth2 login flow with secure cookie-based token storage.

## Build & Development Commands

```bash
# Run tests (Jest with ES modules)
npm test

# Watch mode - syncs changes to AWS
npm run watch

# Tail CloudWatch logs with traces
npm run tail
```

## Architecture

**Stack:** AWS SAM + Lambda (Node.js 24) + API Gateway + Cognito

### Lambda Functions (src/handlers/)

| Handler | Endpoint | Purpose |
|---------|----------|---------|
| `authStatus.ts` | GET / | Check auth status, auto-refresh tokens |
| `redirectToCognito.ts` | GET /login | Redirect to Cognito hosted UI |
| `loginCallback.ts` | GET /login_callback | Exchange auth code for tokens, set cookies |
| `logout.ts` | GET /logout | Clear cookies, redirect to Cognito logout |

### Shared Library (src/lib/)

- **authTokens.ts** - Cognito token exchange (authorization_code and refresh_token grants)
- **authUriHelpers.ts** - URL construction for Cognito endpoints
- **cookies.ts** - Cookie parsing utilities
- **env.ts** - Environment variable validation and loading

Handlers are bundled with esbuild during `sam build`.

### Token Flow

1. User hits `/login` → redirected to Cognito-hosted UI
2. After login, Cognito redirects to `/login_callback` with auth code
3. Lambda exchanges code for tokens, stores in HttpOnly cookies
4. Subsequent requests to `/` verify ID token, auto-refresh if expired using refresh token

## Environments

| Environment | Stack Name | Auth API | Gallery App |
|-------------|------------|----------|-------------|
| dev | tacocat-gallery-auth-dev | auth.staging-pix.tacocat.com | staging-pix.tacocat.com |
| prod | tacocat-gallery-auth-prod | auth.pix.tacocat.com | pix.tacocat.com |

The staging site at `staging-pix.tacocat.com` uses the dev stack, and `pix.tacocat.com` uses prod. Both share the same Cognito user pool at `login.tacocat.com`, so your credentials work on both environments.

## Infrastructure

- **template.yaml** - SAM/CloudFormation template defining all resources
- Secrets stored in AWS Secrets Manager (Cognito client secret)
- CORS restricted to gallery domain
- Cookies: HttpOnly, Secure, SameSite=Strict

## CI/CD

- **gh CLI**: Use the `gh` CLI tool for GitHub operations.
- **Branch protection**: The `main` branch is protected. All changes require a pull request.
- **Pre-commit hooks**: Husky runs lint, typecheck, tests, and gitleaks (secret scanning) on commit.
- **CI workflow**: On PR and push to main, runs lint, type check, unit tests, and SAM build. On push to main, also deploys to staging.
- **Production deploy**: Manual workflow dispatch from GitHub Actions. Runs tests, deploys to prod, creates a release tag (YYYYvN format), and generates release notes.

## Testing

Test event payloads in `events/` directory for local Lambda invocation testing.

## Branch, Commit and PR Types

Use these types for branch names, commit messages, and PR titles:
- `feat`: User-facing features or behavior changes (must change production code)
- `fix`: Bug fixes (must change production code)
- `docs`: Documentation only
- `style`: Code style/formatting (no logic changes)
- `refactor`: Code restructuring without behavior change
- `test`: Adding or updating tests
- `chore`: CI/CD, tooling, dependency bumps, configs (no production code)

## Branch Naming

Use `type/short-description`:
```text
feat/search-pagination
fix/year-search-bug
chore/pre-commit-hooks
```

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <description>

[optional body]
```
- **Scopes:** Optional. Use when it adds clarity (e.g., `auth`, `tokens`, `cookies`).
- **Breaking changes:** Use `!` suffix: `feat!: remove deprecated endpoint`

**Examples:**
```text
feat(auth): add token refresh on expired id_token
fix(cookies): handle URL-encoded values
chore: add husky pre-commit hooks
docs: update API documentation
```

## Pull Requests

**PR titles:** Use conventional commit format, same as commit messages.

**PR descriptions:**
```markdown
## Summary
One sentence describing the overall change.

- Optional supporting details
- If needed

## Test plan
- [ ] How to verify it works
```

### PR Labels

Use labels on pull requests. Apply all labels that fit. Only use the following labels:

- `enhancement` - User-facing features or improvements. Must change production code behavior.
- `refactor` - Production code changes that don't alter behavior
- `bug` - Fixes broken production code functionality
- `test` - Changes to tests
- `documentation` - Documentation changes

**No label needed** for dependency bumps, CI/CD, tooling, or infrastructure changes - these go in "Other Changes" in release notes.
