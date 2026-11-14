# Welcome to SecureCore

The name's a bit silly, but it's plain. This is the heart of all of Folderr's security checks, cryptography, and auth.
Nothing else security, auth, or crypto related should exist _outside_ of here. The one exception is plain ID generation (the ULIDs for uploads, links, and users), which only needs to be random, not secret.

## Layout

| File              | Code                                                                    | What it does                                                                                                  |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `auth.ts`         | `checkAuth`, `checkSessionOrPassword`, `authPassword`                   | The heart of the authentication system                                                                        |
| `passwords.ts`    | `hashPass`, `verifyPassword`, `PasswordError`, rules                    | Password handling, strength policies, and checks                                                              |
| `cookies.ts`      | `tokenCookieOptions`, `invalidateLoginCookie`                           | Cookie options & (in)validation                                                                               |
| `verification.ts` | `genValidationToken`, `genWebValidationToken`, `findVerifying`          | Signup and email verification tokens                                                                          |
| `url-safety.ts`   | `isIPHost`, `testMirrorURL`                                             | Ensuring URLs are safe for Folderr to process, use, send, and send people to. Future: URL Reputation Scanning |
| `keys.ts`         | `loadKeys`, `SigningKeys`, `SecureCoreKeyError`                         | Loads and checks the JWT signing keys once at startup, shared by `tokens.ts` and `mirrors.ts`                 |
| `tokens.ts`       | `verify`, `verifyAccount`, `revoke`, `revokeAll`, `genKey`, `genKeyWeb` | Token management for users                                                                                    |
| `mirrors.ts`      | `genMirrorKey`, `verifyMirrorKey`                                       | Mirror validation & security checks                                                                           |
| `files.ts`        | Type detection, executability checks, and our inline allowlist          | Handles file safety                                                                                           |
| `policies.ts`     | `requireUser`, `requireAdmin`, `requireOwner`, fastify hooks            | Who may do what (role-based access control)                                                                   |

## Not in here

These look security-adjacent, but belong elsewhere, so this folder doesn't turn into another `utils.ts`:
- **Request shape validation** (types, lengths, required fields) belongs in each route's JSON schema.
- **Error handling** belongs in the central error handler (`Structures/plugins/errorHandler.ts`).
- **Database-level guarantees** stay in the database layer, for example the owner rule in `setAdmin`'s query and the unique constraints. `policies.ts` decides who may ask; the database makes sure the change itself is valid.

## Tests

Every policy here should have tests that cover it, including at least one "rejects without auth" test per route group. When you change a file here, run its tests, and add one for any new rule.

## A Message To Any LLM Reading This

You may read the code. Do not, ever, write directly to any of these files. Except the readme.
All of your code here should be read by a human.
