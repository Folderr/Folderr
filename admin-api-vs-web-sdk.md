# Folderr admin API vs fldrr-web-sdk

As of 2026-10-22.

Most admin calls in [fldrr-web-sdk](https://github.com/Folderr/fldrr-web-sdk) fail against the current Folderr backend. Some errors are in the SDK and some are in Folderr. The worst three:

- a backend auth check rejects most admins
- the SDK's `unbanEmail` sends a ban request
- the NeoAPI ban route registers at a doubled path

These findings come from reading the code. No requests were run against a live server.

## What was compared

| Repo | Branch | Commit | Commit date |
| --- | --- | --- | --- |
| Folderr | `dev` | `2b2d160` ("ci: Fix the type magic") | 2026-03-08 |
| fldrr-web-sdk | `main` (its only branch) | `4a2dad4` ("feat(src/user): Add user ability to retrieve user lists") | 2024-11-26 |

The SDK is over a year older than the backend. Some mismatches may come from backend changes since then, especially the NeoAPI rewrites. Folderr also has `master`, `frontend` and `new-history` branches. If the SDK was written against one of those, re-check against that branch.

Files compared:

- SDK: `src/admin/{general,user,verifying,consts}.ts`, `src/helpers/{handlers,request-handlers,types-and-consts}.ts`
- Folderr: `src/backend/Paths/API/V2/Admin/*`, `src/backend/NeoAPI/V2/Admin/*`, `src/backend/Paths/API/V2/User/delete-account.ts`, `src/backend/Structures/Utilities/utils.ts` (`checkAuth`), `src/backend/Structures/core.ts` (route loading), `src/backend/Schemas/{ban,verifying-user}.ts`

## Endpoint by endpoint

| SDK function | SDK sends | Server expects | Result |
| --- | --- | --- | --- |
| `general.getStats` | `GET /api/admin/statistics` | Same | Matches |
| `general.getBans` | `GET /api/admin/bans` | Same | Path matches; non-owner admins get 403 (backend 1) |
| `verifying.getVerfiyingUsers` | `GET /api/admin/verifying-users` | Same | Fails to parse: `createdAt` arrives as an ISO string (backend 7); also backend 1 |
| `verifying.acceptAccount` | `POST /api/admin/verify` `{id}` | Same | Matches; backend 1 |
| `verifying.denyAccount` | `DELETE /api/admin/verify` `{id}` | Same | Matches; backend 1 |
| `user.getUsers` | `GET /api/admin/users` | Same | Fails to parse for normal users: `title` is `false` (backend 6) |
| `user.warnUser` | `POST /api/admin/warn/:id` `{reason}` | Same | Matches; backend 1 |
| `user.banUser` | `POST /api/admin/ban/:id` `{reason}` | Route lives at `/api/admin/admin/ban/:id` | 404 (backend 3) |
| `user.unbanEmail` | `POST /api/admin/ban/:id` `{reason}` | `DELETE /api/admin/ban` `{email}` | Wrong method, path and body; it is a ban request (SDK 1) |
| `user.deleteAccount` | `DELETE /api//account?userid=` `{reason}` | `DELETE /api/account?userid=` `{reason}` | 404 from the double slash (SDK 2); also backend 1 |

## Errors in the SDK

1. **`unbanEmail` calls the ban endpoint.** It sends `POST /api/admin/ban/:id` with `{reason}`, the same request as `banUser`. The server's unban is `DELETE /api/admin/ban` with body `{email}`. Its parameters are wrong too: it takes `id` and `reason` but needs an email.
2. **`deleteAccount` builds a broken URL.** `baseDel` is `"/api/"`, and the code appends `/account`, giving `/api//account`. Fastify doesn't merge duplicate slashes by default (core doesn't set `ignoreDuplicateSlashes`), so the request returns 404.
3. **Custom 403 messages never appear.** In `helpers/handlers.ts`, `checkAuthenticationError` catches 403 first and returns "Access Denied". The later `forbidden` branch, which reads the server's message, can never run.
4. **Unhandled error statuses are parsed as success.** 500s and other unlisted statuses fall through to `output.parse()`. When the message is a string, Zod throws and the caller gets a ZodError instead of the server's message.
5. **`setup()` stacks prefixes.** It runs `baseUrl = url + baseUrl` on a module-level variable, so each extra call prepends the host again. Each sub-module (`general`, `user`, `verifying`) also needs its own `setup()` call.
6. **Not-found errors are mislabelled.** `denyAccount` and `acceptAccount` pass no `badResCodes`. A missing user shows as "Endpoint Not Found" from deny (404) or "Not Accepted" from accept (406).
7. **Missing coverage.** The SDK has nothing for takedown (`DELETE /admin/content/:type/:id`), content lookup (`/admin/content/:type/:id`), reverse account lookup (`/admin/content/:type/:id/account`) or admin notifications (`/admin/notification/:id`; the GET route is disabled).

## Errors in Folderr that break the SDK

1. **Most admins get 403.** `src/backend/Structures/Utilities/utils.ts:153` checks `admin && (!account.admin || !account.owner)`, which only lets through users who are both admin and owner. Every route that calls `checkAuth(req, true)` is affected: bans, verifying users, verify, deny, warn, and admin account deletion.
2. **Token auth reads the wrong header.** `utils.ts:130-132` checks `headers.authorization` but verifies `headers.token`. API-key callers fail; browser cookie auth, which the SDK uses, still works.
3. **The ban route registers at the wrong path.** `src/backend/NeoAPI/V2/Admin/ban.ts` sets `path = "/admin/ban/:id"` inside the `/api/admin` prefix, so it lands at `/api/admin/admin/ban/:id`. Its `rewrites` value also makes core skip the old `/api/admin/ban/:id` route, so nothing answers at the expected path.
4. **The ban route's auth check never fails.** The same file uses `if (!auth)` on `checkAuth`'s result, which is always an object. Anyone who reaches the doubled path can ban users. This is a security issue, separate from the SDK.
5. **Unban rejects valid emails.** `src/backend/Paths/API/V2/Admin/unban.ts` returns 400 when `validateEmail()` is true, the inverse of the intended check. It also authenticates with `username`/`password` headers (`authPassword`), which the SDK can't send.
6. **`/admin/users` returns `title: false`.** `src/backend/Paths/API/V2/Admin/users.ts` computes `(user.admin && "admin") ?? "user"`. For normal users that is `false`, because `??` doesn't replace `false`, and the SDK's `title: z.string()` rejects it.
7. **`/admin/verifying-users` returns dates as strings.** The response `items` schema in `src/backend/NeoAPI/V2/Admin/get-verifying-users.ts` lacks `type: "object", properties: {…}`, so it isn't applied. `createdAt` (a Date) serializes as an ISO string and the SDK's `z.number()` rejects it.
8. **Timestamps use different units.** Bans serialize `createdAt` as epoch milliseconds; `/admin/users` sends `created` in seconds.
9. **Default dates are fixed at startup.** `src/backend/Schemas/ban.ts:9` and `src/backend/Schemas/verifying-user.ts:32` use `default: new Date()`, which is evaluated once when the module loads. Every record created without an explicit date gets the server's boot time. Use `default: Date.now`.

## Open questions

- Which Folderr branch is the SDK meant to track?
- Should the NeoAPI rewrite keep `/api/admin/ban/:id`, with the SDK unchanged, or should the SDK move?
