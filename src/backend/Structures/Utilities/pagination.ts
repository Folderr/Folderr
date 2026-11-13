import type { PageOptions } from "../Database/db-class.js";

export interface PageQuery {
	before?: string;
	after?: string;
	limit?: number;
	ascending?: boolean;
}

const DEFAULT_LIMIT = 100; // Folderr sends really small amounts of data so this is safe
const MAX_LIMIT = 500;
const PAGE_MIN = 1;

function determineDate(value?: string): Date | undefined {
	if (!value) return undefined;
	const date = new Date(/^\d+$/.test(value) ? Number(value) : value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

export const PAGINATION_SCHEMA = {
	// Designed for use with Fastify
	type: "object",
	properties: {
		limit: { type: "integer", minimum: PAGE_MIN, maximum: MAX_LIMIT },
		before: { type: "string" },
		after: { type: "string" },
		ascending: { type: "boolean", default: false },
	},
};

/**
 * Turns a list's querystring into a page by creation time, for the database's list methods
 *
 * @param {PageQuery} query The query for pagination
 * @param {Boolean} [ascending] Whether or not the page should sort in ascending order instead of descending
 * @returns The page, or undefined if before or after isn't a date
 */
export function generateTimePage(
	query: PageQuery,
	ascending?: boolean,
): PageOptions | undefined {
	const beforeTime = determineDate(query.before);
	const afterTime = determineDate(query.after);

	if ((query.before && !beforeTime) || (query.after && !afterTime))
		return undefined;

	const limit = Math.min(
		Math.max(query.limit ?? DEFAULT_LIMIT, PAGE_MIN),
		MAX_LIMIT,
	);
	return { before: beforeTime, after: afterTime, limit, ascending };
}
