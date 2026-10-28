export interface PageQuery {
	before?: string;
	after?: string;
	limit?: number;
	ascending?: boolean;
}

export enum SORT_DIRECTION {
	Ascending = 1,
	Descending = -1,
}

const DEFAULT_LIMIT = 100; // Folderr sends really small amounts of data so this is safe
const MAX_LIMIT = 500;
const PAGE_MIN = 1;

export interface Page {
	filter: { owner?: string; createdAt?: { $lt?: Date; $gt?: Date } };
	options: { sort: { createdAt: SORT_DIRECTION }; limit: number };
}

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
 * Generates a pagination request relevant for the createdAt field on most interfaces/db results
 *
 * @param {PageQuery} query The query for pagination
 * @param {String} [owner] The person who owns what we're looking for
 * @param {Boolean} [ascending] Whether or not the page should sort in ascending order instead of descending
 */
export function generateTimePage(
	query: PageQuery,
	owner?: string,
	ascending?: boolean,
): Page | undefined {
	const beforeTime = determineDate(query.before);
	const afterTime = determineDate(query.after);

	if ((query.before && !beforeTime) || (query.after && !afterTime))
		return undefined;

	const filter: Page["filter"] = owner ? { owner } : {};
	if (beforeTime || afterTime) {
		filter.createdAt = {
			...(beforeTime && { $lt: beforeTime }),
			...(afterTime && { $gt: afterTime }),
		};
	}

	const limit = Math.min(
		Math.max(query.limit ?? DEFAULT_LIMIT, PAGE_MIN),
		MAX_LIMIT,
	);
	return {
		filter,
		options: {
			sort: {
				createdAt: ascending
					? SORT_DIRECTION.Ascending
					: SORT_DIRECTION.Descending,
			},
			limit,
		},
	};
}
