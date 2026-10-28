import type { FastifyInstance } from "fastify";
import type Core from "./core";

// Handles all new-style routes, including the API ones
export interface NeoRoute {
	name?: string;
	path: string;
	method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
	/** A function is called with core once it's ready, for routes that depend on config */
	enabled: boolean | ((core: Core) => boolean);
	rewrites?: string;
	route: (fastify: FastifyInstance, core: Core) => void;
}
