import type { FoldCodesI } from "./Utilities/fold-codes.js";

export type FolderrErrorOptions = {
	cause?: unknown;
	/** The HTTP status the error handler answers with. Left unset, the error is a 500 */
	statusCode?: number;
	/** The fold code sent as the response's `code`, by name. The error handler turns it into the number */
	foldCode?: keyof FoldCodesI;
	/** A 5xx that isn't a bug (e.g. the mail server timing out): answered, but not reported or counted */
	expected?: boolean;
	/** A machine-readable ID, like "DB_CONFLICT_ERROR" or a library's own code ("ETIMEDOUT") */
	code?: string;
};

/**
 * @desc The base for Folderr's own errors. The error handler reads these fields to decide how to answer,
 * so a thrown FolderrError needs no catch in the route.
 */
export class FolderrError extends Error {
	public readonly statusCode?: number;

	public readonly foldCode?: keyof FoldCodesI;

	public readonly expected: boolean;

	public readonly code?: string;

	constructor(message: string, options: FolderrErrorOptions = {}) {
		super(message, { cause: options.cause });
		this.name = "FolderrError";
		this.statusCode = options.statusCode;
		this.foldCode = options.foldCode;
		this.expected = options.expected ?? false;
		this.code = options.code;
	}
}
