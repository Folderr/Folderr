import type Path from "../../../Structures/path.js";

// Every API route now lives in NeoAPI. This stays until the legacy loader (registerApis) is removed.
export const version = "2";
export const prefix = "/api";

export const endpoints: Record<string, typeof Path> = {};
