// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vite/client" />

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
// Vite passes every env value through as a string, and unset ones are undefined
interface ImportMetaEnv {
	readonly VITE_SENTRY?: string;
	readonly VITE_SENTRY_TRACING?: string;
	readonly VITE_SENTRY_RATE?: string;
	readonly VITE_SENTRY_REPLAY?: string;
	readonly VITE_SENTRY_REPLAY_RATE?: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
