# AGENTS.md

Guidance for AI coding agents working in Folderr. Humans may find it useful too.

## What Folderr is

A self-hosted file host and link shortener: a Fastify 5 backend (TypeScript, ESM) with a Vue frontend served by Vite.
Folderr is **in development**: there are no existing installs to stay compatible with, so prefer the clean change over a compatibility shim.
Even if there are existing installs, Folderr is currently considered "close to release candidate but unstable"
Don't change the shape or behavior of routes unless absolutely needed and you have the OK from a human.

## Hard rules

1. **Never write to `src/backend/security/` (SecureCore).** Read it, review it, suggest changes; the owner writes them by hand.
   This is enforced in `.claude/settings.json` for Claude Code. Other agents or agent operators should create their own respective hard-deny rules and an equivalent denial to modify that rule.
2. **Don't commit unless asked to commit that specific change.** Permission to edit, or to commit something else, isn't permission to commit this.
3. **Never force-push, or rewrite published history.**
4. **Never push** unless explicitly asked to.
5. **Don't delete code without re-checking its callers right before deleting.** A search from earlier in the session goes stale as soon as someone else commits.
6. **Leave untracked notes out of commits** (`*.md` audit and plan files in the repo root), unless asked.

## Setup

- Ensure you cannot write to `src/backend/security` before setup
- Node version >= 22.12
- `npm ci` Install dependencies
- `npm run build` Build Folderr
- Copy `configs.example` to `configs`
- `npm run setup` An interactive prompt for setting up Folderr. Pass in prompted `folderr_username`, `folderr_password`, and `folderr_email` env variables and interactively enter `internal` (recommended) for key generation. Alternatively to the interactive key generation, generate your own keys according to `src/backend/security/keys.ts` policy and **_always_** provide it to Folderr when running, as `PRIVATE_KEY`. (Must provide `PUBLIC_KEY` during setup)

## Layout

| Path                                      | What's there                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/backend/index.ts`                    | Entry point                                                                                                                           |
| `src/backend/handlers/startup-handler.ts` | Startup order: database → plugins (SecureCore included) → routes → listen                                                             |
| `src/backend/Structures/core.ts`          | `Core`: config, database, logger, Fastify instance, route loading                                                                     |
| `src/backend/Structures/Database/`        | `DBClass` interface and the SQLite engine (`sqlite.ts`, Drizzle + libSQL)                                                             |
| `src/backend/security/`                   | **SecureCore**: auth policies, tokens, keys, passwords, cookies, URL safety, upload checks. See its `README.md`. Read-only for agents |
| `src/backend/API/V2/<Group>/`             | API routes; each folder's `index.ts` exports its URL prefix                                                                           |
| `src/backend/Routes/`                     | Site routes (`/f/:id`, `/l/:id`, …)                                                                                                   |
| `src/frontend/`                           | Vue app                                                                                                                               |
| `drizzle/sqlite/`                         | Migrations (generated, see below)                                                                                                     |
| `scripts/`                                | `setup.ts` (first-run setup) and the migration squash script                                                                          |

## Commands

| Task                         | Command                                       |
| ---------------------------- | --------------------------------------------- |
| Dev server (backend + Vite)  | `npm run dev` (port 8888)                     |
| Typecheck backend + frontend | `npm run typecheck`                           |
| Lint / fix                   | `npm run lint` / `npm run lint:fix` (Biome)   |
| Build                        | `npm run build` (swc backend + Vite frontend) |
| New migration                | `npm run migrations:gen:sqlite`               |

Hooks (lefthook): **pre-commit** runs `biome check --write` on staged files; **pre-push** runs both typechecks. Install with `npm run installdev`.

Dev server _needs_ `NODE_ENV=dev` and can use `DEBUG=true` for debug logging

## Style

- Follows biome standards based on old prettier + eslint-xo config
- TypeScript strict mode
- Double quotes where possible, always semicolons.
- Use functional coding patterns where possible and minimize your use of classes but use when more practical than functional patterns are

## Writing routes

Every route file default-exports a `NeoRoute`. Follow the shape of `API/V2/Management/*.ts`:

```ts
type RouteTypes = { Params: { id: string } };

fastify.route<RouteTypes>({
	method,
	url: path,
	schema: {
		/* JSON schema, plus 4xx examples */
	},
	preHandler: fastify.policy.requireAdmin,
	async handler(request: FastifyRequest<RouteTypes>, reply: FastifyReply) {
		const auth = fastify.requestUser(request); // only after a policy hook
		// …
	},
});
```

- **Auth goes in `preHandler`, never in the handler.** Policies live in `fastify.policy`:
  - `requireUser`: any sign-in, API tokens included. Use for content: uploads, links, listing your own files.
  - `requireAdmin` / `requireOwner`: role checks.
  - `requireSessionOrPassword` ("APIn't"): website login or username + password, **never** an API token. Use for anything that manages the account: updating or deleting it, creating API tokens, mirrors.
  - `logoutPolicy`: sign-out, which is never expected to fail. Any failures here are completely unexpected and marked as an internal error
  - `requirePasswordConfirmation(when)`: the current password is needed for this change.
  - `preHandler` takes an array; hooks run in order and stop at the first one that replies.
- **Pass route types to `route<RouteTypes>()`.** Annotating only the handler's `request` breaks type inference once a `preHandler` is added.
- **Read the signed-in user with `fastify.requestUser(request)`**, not `request.user!`. It throws, naming the route, if the policy hook is missing.
- **Standard auth responses:** 401 `{ code: 401, message: "Authorization failed." }`, 403 `{ code: 403, message: "Action forbidden" }`. Keep the schema examples in sync.
- **Errors:** let unexpected errors throw. The central error handler (`Structures/plugins/errorHandler.ts`) logs them, reports them to Sentry and returns 500. Five unhandled errors take a route offline, so don't turn expected failures (bad input, invalid token) into throws.
- **Request shape validation goes in the route's JSON schema**, not in SecureCore.

## Database

- Drizzle ORM on libSQL (SQLite). The engine is `Structures/Database/sqlite.ts`, behind the `DBClass` interface.
- **Unreleased migrations may be regenerated**, but once a migration has been applied anywhere (including a dev database), add a new one or reset that database. Drizzle tracks applied migrations by folder name.
- Release migrations get squashed with `npm run migrations:squash:sqlite`.

## TypeScript and ESM gotchas

- The backend is ESM, built with swc (`resolveFully` adds `.js` to relative imports). Existing code mostly writes `.js`; match the file you're in.
- **CommonJS named imports can fail at runtime even when `tsc` passes.** For example, `import { JsonWebTokenError } from "jsonwebtoken"` crashes on load; use `const { JsonWebTokenError } = jwt;` from the default import. Start the server once after touching imports.
- **Biome doesn't catch a missing `await` on a stored promise** (`const ok = asyncFn(); if (!ok)`), and neither does `tsc`. Read async checks carefully.

## Commits

- Conventional-style subjects, scoped: `fix(security): …`, `refactor(api/admin): …`, `chore(lint): …`. Older commits say `refractor`; use `refactor` from now on.
- One logical change per commit. Split by module when asked.
- Add a `Co-Authored-By` trailer for an AI agent only when the agent wrote most of that commit.

## Pull requests

- **Ensure you are working on a fork unless you are a maintainer**
- **Only open a PR when asked.** Opening one publishes the branch and its description.
- **Base branch is `dev`**, not `master` until version `2.0.0` release.
- **Branch names:** `type/short-topic`, matching the commit type: `refactor/…`, `fix/…`, `security/…`, `chore/…`.
- **One concern per PR.** A refactor, a behaviour change and a dependency bump are three PRs.
- **Title:** the same style as commit subjects, e.g. `refactor(security): Move auth into Fastify policies`.
- **Description:**

      # What this PR does
      - …the behaviour that changes, not a file list

      # What's left to do
      - …or "Nothing"

      # How it was checked
      - …commands run, routes called, and what you couldn't exercise

- **CI must pass:** `npm run typecheck`, `npm run build` and `npx biome ci .` all run on every PR. Run them locally first.
- **Call out breaking changes** to the API, config files or database schema (including new migrations) at the top of the description.
- **Answer review comments with a commit** that fixes them; Respond to the original comment explaining the fix if asked to; don't force-push over reviewed commits.
- **AI-written PRs:** end the description with the tool's attribution line (for example "Generated with Claude Code") only if the agent wrote most of the change, the same rule as commit trailers.

## Tests

None yet, on purpose: they're deferred until the API's shape and behaviour settle. Until then, verify by running the server (`npm run dev`, or `tsx src/backend/index.ts` with `NODE_ENV=dev`) and calling the routes, and **say which paths you couldn't exercise** (for example signed-in requests or 403s).

## Done when

- Lint check passes on staged commits
- `npm run typecheck` passes on backend & frontend
- Folderr builds
- The routes you modified respond properly

## Frontend conventions

- Use `@` (like `@click`) for Vue. biome/
- Minimize writing core logic and touching authentication, leave that to people
- New API methods should not be written here, instead they should only be written to the web-sdk
- Remaining API in Folderr should be under wrappers/
- Typescript as much as possible
- Use as standard Tailwind as possible
- Enforce accessibility wherever possible
- `utils/request-helpers.ts` Should be only used for `wrappers/`
- `stores/` is meant to represent stuff in Folderr's backend (like the user object) as a convenience
- `utils/regexs` is the client-facing half of the regexs found in the backend (`src/backend/security/passwords.ts PASSWORD_REGEX` and `src/backend/Structures/Utilities/reg-exps.ts`) and should be updated from those backend regexs, adapted for the browser. (They may lose some capability in terms of function but thats why we have the backend double check)


<!-- TODO(owner): Better Auth migration notes, release process -->
