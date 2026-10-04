# Cognito, as it was configured

The user pool this stack authenticated against was built by hand in the AWS console, never from a template, so these files are its only record. They were exported on 2026-10-03 with `aws cognito-idp describe-*` and `list-*`, after the gallery had moved to Cloudflare and before the pool was deleted. The confidential client's secret has been removed; everything else is as the API returned it.

| File                                                                        | What it is                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `user-pool.json`                                                            | The pool `us-east-1_DdPFtamLz`, created 2023-09-12: email as username, optional MFA, password policy, the `login.tacocat.com` custom domain |
| `user-pool-client-7asah0n7edj39i2b9st1fu1olo.json`                          | The confidential app client this stack used, with its OAuth flows, scopes, callback and logout URLs, and token validities                   |
| `user-pool-client-li056l81nmaqbsn0lk65qoagu.json`                           | A second, public app client without a secret, unused by this stack                                                                          |
| `user-pool-domain.json`                                                     | The hosted UI's custom domain, its certificate and the CloudFront distribution Cognito put in front of it                                   |
| `groups.json`                                                               | The one group, `Admins`                                                                                                                     |
| `identity-providers.json`, `resource-servers.json`, `ui-customization.json` | Empty: no social providers, no resource servers, no hosted UI customization                                                                 |

The pool had five users, all admins; they are not exported. Every environment of this stack shared this one pool and client, as `samconfig.toml` shows.
