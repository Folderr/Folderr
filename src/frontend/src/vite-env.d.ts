// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vite/client" />

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMetaEnv {
	readonly VITE_SENTRY: string;
	readonly VITE_SENTRY_TRACING: boolean;
	readonly VITE_SENTRY_RATE: number;
	readonly VITE_SENTRY_REPLAYS: boolean;
	readonly VITE_SENTRY_REPLAY_RATE: number;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
