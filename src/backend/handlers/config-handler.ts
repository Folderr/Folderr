import { existsSync, readFileSync } from "fs";
import yaml from "js-yaml";
import { join } from "path";
import process from "process";
import z from "zod";

const Db = z.strictObject({
	url: z.string().trim().min(1), // Accepts as `file:./local.db`, `file:[absolute]`, or a turso remote database url
	authToken: z.string().trim().optional(),
});

const zbool = z.union([
	z.boolean(),
	z
		.enum(["true", "1", "false", "0"])
		.transform((v) => v === "true" || v === "1"),
]);
const existingFile = z
	.string()
	.refine((file) => existsSync(file), "file not found");

const MAX_PORT = 65535;
const MIN_PORT_LINUX = 1024;

const Https = z.strictObject({
	key: existingFile,
	cert: existingFile,
	ca: z.array(existingFile).optional(),
	requestCert: zbool.default(false),
});

const Sentry = z.strictObject({
	dsn: z.httpUrl(),
	tracing: zbool.optional(),
	// When unset, loadConfig uses 1 in dev and 0.2 otherwise
	rate: z.coerce.number().gte(0).lte(1).optional(),
});

const Server = z.strictObject({
	// Not z.httpUrl(): that also demands a dotted domain, which rules out localhost and IPs
	url: z.url({ protocol: /^https?$/ }),
	port: z.coerce.number().int().min(MIN_PORT_LINUX).max(MAX_PORT),
	apiOnly: zbool.default(false),
	trustProxies: zbool.default(false),
	signups: z.coerce.number().int().min(0).max(2),
	httpsCertOptions: Https.optional(),
	sentry: Sentry.optional(),
});

const MailerOptions = z.strictObject({
	port: z.coerce.number().int().min(1).max(MAX_PORT).default(587),
	secure: zbool.default(false),
	host: z.hostname(),
	requireTLS: zbool.default(false),
	ignoreTLS: zbool.default(false),
	auth: z.strictObject({
		user: z.string().trim().min(1),
		pass: z.string().min(1),
	}),
	tls: z
		.strictObject({
			rejectUnauthorized: zbool,
		})
		.optional(),
});

const Email = z.strictObject({
	sendingEmail: z.email(),
	mailerOptions: MailerOptions,
	selfTest: zbool.default(false),
});

// No email section at all means the emailer is off
const ConfigSchema = z.object({
	server: Server,
	db: Db,
	email: Email.optional(),
});
export type Config = z.infer<typeof ConfigSchema>;

/* ENV */

const ENV: Record<string, string> = {
	FOLDERR_URL: "server.url",
	FOLDERR_PORT: "server.port",
	FOLDERR_SIGNUPS: "server.signups",
	FOLDERR_TRUST_PROXIES: "server.trustProxies",
	FOLDERR_API_ONLY: "server.apiOnly",
	FOLDERR_HTTPS_KEY: "server.httpsCertOptions.key",
	FOLDERR_HTTPS_CERT: "server.httpsCertOptions.cert",
	FOLDERR_HTTPS_REQUESTCERT: "server.httpsCertOptions.requestCert",
	FOLDERR_HTTPS_CA: "server.httpsCertOptions.ca",
	FOLDERR_SENTRY_DSN: "server.sentry.dsn",
	FOLDERR_SENTRY_RATE: "server.sentry.rate",
	FOLDERR_SENTRY_TRACING: "server.sentry.tracing",
	FOLDERR_DB_URL: "db.url",
	FOLDERR_DB_AUTH_TOKEN: "db.authToken",
	FOLDERR_EMAIL_FROM: "email.sendingEmail",
	FOLDERR_EMAIL_SELF_TEST: "email.selfTest",
	FOLDERR_SMTP_HOST: "email.mailerOptions.host",
	FOLDERR_SMTP_PORT: "email.mailerOptions.port",
	FOLDERR_SMTP_SECURE: "email.mailerOptions.secure",
	FOLDERR_SMTP_REQUIRE_TLS: "email.mailerOptions.requireTLS",
	FOLDERR_SMTP_IGNORE_TLS: "email.mailerOptions.ignoreTLS",
	FOLDERR_SMTP_USER: "email.mailerOptions.auth.user",
	FOLDERR_SMTP_PASS: "email.mailerOptions.auth.pass",
	FOLDERR_SMTP_TLS_REJECT_UNAUTHORIZED:
		"email.mailerOptions.tls.rejectUnauthorized",
};

// Settings whose environment variable holds a comma-separated list
const LIST_PATHS = new Set(["server.httpsCertOptions.ca"]);

function readConfigFile(
	dir: string,
	filename: string,
): Record<string, unknown> | undefined {
	const file = join(dir, filename);
	if (!existsSync(file)) return undefined;
	const parsed = yaml.load(readFileSync(file, "utf8"));
	// An empty or fully commented-out file is the same as no file
	if (parsed === undefined || parsed === null) return undefined;
	// A file that isn't key: value pairs counts as empty, so the schema lists what's missing
	return typeof parsed === "object"
		? (parsed as Record<string, unknown>)
		: {};
}

function setPath(
	target: Record<string, unknown>,
	path: string,
	value: unknown,
) {
	const keys = path.split(".");
	// pop() leaves the parents in keys and gives the key to set
	const last = keys.pop();
	if (!last) {
		throw new Error(`setPath: "${path}" has no key to set`);
	}

	let node = target;
	for (const key of keys) {
		if (typeof node[key] !== "object" || node[key] === null) node[key] = {};
		node = node[key] as Record<string, unknown>;
	}
	node[last] = value;
}

export function loadConfig(
	env: NodeJS.ProcessEnv = process.env,
	dir = join(process.cwd(), "configs"),
): Config {
	// A missing file is fine as long as environment variables fill in what it would have;
	// the schema reports whatever is still missing
	const raw: Record<string, unknown> = {
		server: readConfigFile(dir, "server.yaml") ?? {},
		db: readConfigFile(dir, "db.yaml") ?? {},
		email: readConfigFile(dir, "email.yaml"),
	};

	// Overwrite any entries with the environment variable equivalent
	for (const [name, path] of Object.entries(ENV)) {
		const value = env[name];
		if (value === undefined || value === "") continue;
		// Lists come in comma-separated, e.g. FOLDERR_HTTPS_CA=/certs/a.pem,/certs/b.pem
		setPath(
			raw,
			path,
			LIST_PATHS.has(path)
				? value
						.split(",")
						.map((item) => item.trim())
						.filter(Boolean)
				: value,
		);
	}

	const result = ConfigSchema.safeParse(raw);
	if (!result.success) {
		throw new Error(`Invalid config!\n${z.prettifyError(result.error)}`);
	}

	const config = result.data;
	// Checked against undefined, so a rate of 0 (no tracing samples) is kept
	if (config.server.sentry && config.server.sentry.rate === undefined) {
		config.server.sentry.rate = env.NODE_ENV === "dev" ? 1 : 0.2;
	}
	return config;
}
