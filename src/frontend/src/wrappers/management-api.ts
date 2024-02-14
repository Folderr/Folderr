import * as Sentry from "@sentry/vue";

const httpCodes = {
	unauthorization: 401,
	forbidden: 403,
	notFound: 404,
	notAccepted: 406,
	created: 201,
	ok: 200,
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const BASE_URL = "/api/manage/";

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

function genericCatch<T>(error: unknown): GenericFetchReturn<T> {
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

type GenericFetchReturn<T = void> =
	| {
			error: string | Error;
			success: false;
			response?: Response;
			output: undefined;
	  }
	| { error: undefined; success: true; response?: Response; output?: T };

export async function promoteUserToAdmin(
	id: string
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch(`${BASE_URL}admin/${id}`, {
			credentials: "same-origin",
			method: "POST",
		});

		if (response.status === httpCodes.notFound) {
			return {
				error: "User Not Found",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === httpCodes.notAccepted) {
			return {
				error: "Promotion Failed",
				success: false,
				response,
				output: undefined,
			};
		}

		const check = checkAuthenticationError(response);
		if (check) {
			return check;
		}

		if (response.status === httpCodes.forbidden) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const json: { code: number; message: string } | undefined =
				await response.json();
			return {
				error:
					json?.message ??
					"You are not authorized to perform that action",
				success: false,
				output: undefined,
				response,
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json: { code: number; message: string | any } | undefined =
			await response.json();
		if (!json?.code) {
			throw Error(`Unexpected Error: ${response.statusText}`);
		}

		if (response.status !== httpCodes.ok) {
			switch (typeof json?.message) {
				case "string":
					throw Error(`Error: ${json.code} ${json.message}`);
				default:
					throw Error(`Unexpected Error ${json.code}`);
			}
		}

		if (json?.message) {
			switch (typeof json?.message) {
				case "string":
					return {
						error: undefined,
						success: true,
						response,
						output: json.message,
					};

				default:
					throw Error(`Error: ${json.code} ${json.message}`);
			}
		}

		throw Error(`Unexpected Output: ${response.statusText}`);
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function demoteUserToAdmin(
	id: string,
	reason: string
): Promise<GenericFetchReturn<string>> {
	const body = JSON.stringify({ reason });
	try {
		const response = await fetch(`${BASE_URL}admin/${id}`, {
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body,
			method: "DELETE",
		});

		if (response.status === httpCodes.notFound) {
			return {
				error: "User Not Found",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === httpCodes.notAccepted) {
			return {
				error: "Promotion Failed",
				success: false,
				response,
				output: undefined,
			};
		}

		const check = checkAuthenticationError(response);
		if (check) {
			return check;
		}

		if (response.status === httpCodes.forbidden) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const json: { code: number; message: string } | undefined =
				await response.json();
			return {
				error:
					json?.message ??
					"You are not authorized to perform that action",
				success: false,
				output: undefined,
				response,
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json: { code: number; message: string | any } | undefined =
			await response.json();
		console.log(json);
		if (!json?.code) {
			throw Error(`Unexpected Error: ${response.statusText}`);
		}

		if (response.status !== httpCodes.ok) {
			switch (typeof json?.message) {
				case "string":
					throw Error(`Error: ${json.code} ${json.message}`);
				default:
					throw Error(`Unexpected Error ${json.code}`);
			}
		}

		if (json?.message) {
			switch (typeof json?.message) {
				case "string":
					return {
						error: undefined,
						success: true,
						response,
						output: json.message,
					};

				default:
					throw Error(`Error: ${json.code} ${json.message}`);
			}
		}

		throw Error(`Unexpected Output: ${response.statusText}`);
	} catch (error: unknown) {
		return genericCatch(error);
	}
}
