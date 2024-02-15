import * as Sentry from "@sentry/vue";

export const httpCodes = {
	unauthorization: 401,
	forbidden: 403,
	notFound: 404,
	notAccepted: 406,
	created: 201,
	ok: 200,
};

export async function requestHelper<T>(
	url: string,
	method: "POST" | "GET" | "DELETE" | "PATCH",
	expects: "Array" | "string",
	options?: {
		body?: string;
		altCode?: number;
		altMessage?: string;
		notAcceptedMessage?: string;
		notFoundMessage?: string;
		forbiddenMessage?: string;
	}
): Promise<GenericFetchReturn<T>> {
	if (options?.altCode && !options.altMessage) {
		throw new Error("You must have an altMessage when you have an altCode");
	}

	let preResponse: Promise<Response>;
	switch (typeof options?.body) {
		case "string":
			preResponse = fetch(url, {
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/json",
				},
				body: options.body,
				method,
			});
			break;

		default:
			preResponse = fetch(url, {
				credentials: "same-origin",
				method,
			});
	}

	try {
		const response = await preResponse;
		const check = await badResponseHandler(response, {
			notAccepted: options?.notAcceptedMessage,
			notFound: options?.notFoundMessage,
			forbidden: options?.forbiddenMessage,
		});
		if (check) {
			return check;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json: { code: number; message: string | any } | undefined =
			await response.json();
		if (!json?.code) {
			throw Error(`Unexpected Error: ${response.statusText}`);
		}

		if (options?.altCode && options.altMessage) {
			if (json.code === options?.altCode) {
				return {
					error: undefined,
					success: true,
					response, // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					output: json?.message ?? options.altMessage,
				};
			}
		}

		if (expects === "string") {
			const output = handleString<T>(json, response);
			if (output.error && output.error instanceof Error)
				throw output.error;
			else if (output.error) throw new Error(output.error);
			return output;
		}

		if (expects === "Array") {
			const output = handleArray<T>(json, response);
			if (output.error && output.error instanceof Error)
				throw output.error;
			else if (output.error) throw new Error(output.error);
			return output;
		}

		return {
			error: "No Output",
			output: undefined,
			response,
			success: false,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

function handleArray<T>(
	json: { code: number; message: string | any | T[] },
	response: Response
): GenericFetchReturn<T> {
	if (json?.message) {
		switch (typeof json?.message) {
			case "string":
				return {
					error: new Error(`${json.code} ${json.message}`),
					success: false,
					response,
					output: undefined,
				};
			default:
				if (Array.isArray(json.message)) {
					return {
						error: undefined,
						success: true,
						response,
						output: json.message as T,
					};
				}

				return {
					error: new Error(
						`${
							json.code
						} Unknown Error. Message type: ${typeof json.message}`
					),
					success: false,
					response,
					output: undefined,
				};
		}
	}

	return {
		error: new Error(`No Message`),
		success: false,
		response,
		output: undefined,
	};
}

function handleString<T>(
	json: { code: number; message: string | any },
	response: Response
): GenericFetchReturn<T> {
	if (json?.message) {
		switch (typeof json?.message) {
			case "string":
				return {
					error: undefined,
					success: true,
					response,
					output: json.message as T,
				};

			default:
				return {
					error: new Error(
						`${
							json.code
						} Unknown Error. Message type: ${typeof json.message}`
					),
					success: false,
					response,
					output: undefined,
				};
		}
	}

	return {
		error: new Error(`No Message`),
		success: false,
		response,
		output: undefined,
	};
}

function checkAuthenticationError(
	response: Response
): GenericFetchReturn<undefined> | undefined {
	switch (response.status) {
		case httpCodes.forbidden:
			return {
				error: "Access Denied",
				output: undefined,
				response,
				success: false,
			};
		case httpCodes.unauthorization:
			return {
				error: "Authorization Failed",
				output: undefined,
				response,
				success: false,
			};
		default:
			return undefined;
	}
}

export function genericCatch<T>(error: unknown): GenericFetchReturn<T> {
	Sentry.captureException(error);
	if (
		error instanceof Error &&
		error.message === "Failed to fetch" &&
		import.meta.env.DEV
	) {
		console.log(
			`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`
		);
		console.log(error);
	}

	if (error instanceof Error) {
		if (error.message.includes("Authorization failed")) {
			return {
				error: "Authorization failed",
				success: false,
				output: undefined,
			};
		}
	}

	console.log(error);

	return {
		error: "An unknown error occurred",
		success: false,
		output: undefined,
	};
}

export async function badResponseHandler(
	response: Response,
	codeMessage: {
		notAccepted?: string;
		notFound?: string;
		forbidden?: string;
	}
): Promise<GenericFetchReturn<undefined> | undefined> {
	const check = checkAuthenticationError(response);
	if (check) {
		return check;
	}

	if (response.status === httpCodes.notFound) {
		return {
			error: codeMessage.notFound ?? "User Not Found",
			success: false,
			response,
			output: undefined,
		};
	}

	if (response.status === httpCodes.notAccepted) {
		return {
			error: codeMessage.notAccepted ?? "Not Accepted",
			success: false,
			response,
			output: undefined,
		};
	}

	if (response.status === httpCodes.forbidden) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json: { code: number; message: string } | undefined =
			await response.json();
		return {
			error:
				json?.message ??
				codeMessage.forbidden ??
				"You are not authorized to perform that action",
			success: false,
			output: undefined,
			response,
		};
	}
}

export type GenericFetchReturn<T = void> =
	| {
			error: string | Error;
			success: false;
			response?: Response;
			output: undefined;
	  }
	| { error: undefined; success: true; response?: Response; output?: T };
