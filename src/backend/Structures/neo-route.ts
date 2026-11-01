import type { FastifyInstance } from "fastify";
import type Core from "./core";

// Every route file's default export, for the API and for site pages like /f/:id
export interface NeoRoute {
	name?: string;
	/** One URL, or several that share a handler (e.g. /f/:id and /file/:id) */
	path: string | string[];
	method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
	/** A function is called with core once it's ready, for routes that depend on config */
	enabled: boolean | ((core: Core) => boolean);
	route: (fastify: FastifyInstance, core: Core) => void;
}
