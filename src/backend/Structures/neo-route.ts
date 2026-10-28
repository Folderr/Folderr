import type { FastifyInstance } from "fastify";
import type Core from "./core";

// Handles all new-style routes, including the API ones
export interface NeoRoute {
	name?: string;
	path: string;
	method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
	enabled: boolean;
	rewrites?: string;
	route: (fastify: FastifyInstance, core: Core) => void;
}
