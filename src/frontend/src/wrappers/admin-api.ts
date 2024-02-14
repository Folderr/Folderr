import * as Sentry from "@sentry/vue";

const httpCodes = {
	unauthorization: 401,
	forbidden: 403,
	notFound: 404,
	notAccepted: 406,
	created: 201,
	ok: 200,
};

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

// eslint-disable-next-line @typescript-eslint/naming-convention
const BASE_URL = "/api/admin/";

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

type Stats = {
	users: number;
	links: number;
	files: number;
	bannedEmails: number;
	whitelistedEmails: number;
};

export async function getStats(): Promise<GenericFetchReturn<Stats>> {
	try {
		const response = await fetch(`${BASE_URL}/statistics`, {
			method: "GET",
			credentials: "same-origin",
		});
		const check = checkAuthenticationError(response);
		if (check) {
			return check;
		}

		console.log("Hi from AdminAPI Wrapper L18");
		const output: {
			code: number;
			message: Stats;
		} = (await response.json()) as { code: number; message: Stats };
		return { error: undefined, success: true, output: output.message };
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === "Failed to fetch" &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`
			);
		}

		console.log(error);
		console.log("Hi from AdminAPI Wrapper L32");
		return {
			error: "An unknown error occurred",
			success: false,
			output: undefined,
		};
	}
}

export type AdminUsersReturn = {
	title: string;
	links: number;
	files: number;
	id: string;
	email: string;
	username: string;
	created: number;
};

export async function getUsers(): Promise<
	GenericFetchReturn<AdminUsersReturn[] | string>
> {
	try {
		const response = await fetch(`${BASE_URL}users`, {
			credentials: "same-origin",
		});
		const check = checkAuthenticationError(response);
		if (check) {
			return check;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json:
			| { code: number; message: string | AdminUsersReturn[] }
			| undefined = await response.json();

		if (!json?.code) {
			throw Error(`Unexpected Error: ${response.statusText}`);
		}

		if (response.status !== httpCodes.ok) {
			switch (typeof json?.message) {
				case "string":
					throw Error(`Error: ${json.code} ${json.message}`);
				case "object":
					if (!Array.isArray(json.message)) {
						throw Error(`Unexpected Error: ${json.code}`);
					}

					break;
				default:
					throw Error(`Unexpected Error ${json.code}`);
			}
		}

		const dbNotFound = 1054;

		if (json.code === dbNotFound) {
			return {
				error: undefined,
				success: true,
				response,
				output: json?.message ?? "No users found",
			};
		}

		if (json?.message) {
			switch (typeof json?.message) {
				case "string":
					throw Error(`Error: ${json.code} ${json.message}`);
				default:
					return {
						error: undefined,
						success: true,
						response,
						output: json?.message,
					};
			}
		}

		throw Error(`Unexpected Output: ${response.statusText}`);
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

// TODO: getBans, unbanEmail

type VerifyingUser = {
	id: string;
	username: string;
	email: string;
	createdAt: Date;
};

export async function getVerifyingUsers(): Promise<
	GenericFetchReturn<VerifyingUser[]>
> {
	try {
		const response = await fetch(`${BASE_URL}verifying-users`, {
			credentials: "same-origin",
		});
		const check = checkAuthenticationError(response);
		if (check) {
			return check;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json: { code: number; message: string | any } | undefined =
			await response.json();
		if (!json?.code) {
			throw Error(`Unexpected Error: ${response.statusText}`);
		}

		if (response.status !== 200) {
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
					throw Error(`Error: ${json.code} ${json.message}`);
				default:
					if (Array.isArray(json.message)) {
						return {
							error: undefined,
							success: true,
							response,
							output: json.message,
						};
					}
			}
		}

		throw Error(`Unexpected Output: ${response.statusText}`);
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function denyAccount(
	id: string
): Promise<GenericFetchReturn<string>> {
	const body = JSON.stringify({ id });
	console.log(body);
	try {
		const response = await fetch(`${BASE_URL}/verify`, {
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body,
			method: "DELETE",
		});
		if (response.status === httpCodes.notAccepted) {
			return {
				error: "Verifying User Not Found",
				success: false,
				response,
				output: undefined,
			};
		}

		const check = checkAuthenticationError(response);
		if (check) {
			return check;
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

export async function acceptAccount(
	id: string
): Promise<GenericFetchReturn<string>> {
	const body = JSON.stringify({ id });
	try {
		const response = await fetch(`${BASE_URL}verify`, {
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body,
			method: "POST",
		});

		if (response.status === httpCodes.notAccepted) {
			return {
				error: "Verifying User Not Found",
				success: false,
				response,
				output: undefined,
			};
		}

		const check = checkAuthenticationError(response);
		if (check) {
			return check;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json: { code: number; message: string | any } | undefined =
			await response.json();
		if (!json?.code) {
			throw Error(`Unexpected Error: ${response.statusText}`);
		}

		if (response.status !== httpCodes.created) {
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

export async function deleteAccount(
	id: string,
	reason: string
): Promise<GenericFetchReturn<string>> {
	const body = JSON.stringify({ reason });
	try {
		const response = await fetch(`/api/account?userid=${id}`, {
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

		const check = checkAuthenticationError(response);
		if (check) {
			return check;
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

export async function warnUser(
	id: string,
	reason: string
): Promise<GenericFetchReturn<string>> {
	const body = JSON.stringify({ reason });
	try {
		const response = await fetch(`${BASE_URL}/warn/${id}`, {
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body,
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
				error: "Warn failed",
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
					"You are not authorized to perform that action",
				success: false,
				output: undefined,
				response,
			};
		}

		const check = checkAuthenticationError(response);
		if (check) {
			return check;
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

export async function banUser(
	id: string,
	reason: string
): Promise<GenericFetchReturn<string>> {
	const body = JSON.stringify({ reason });
	try {
		const response = await fetch(`${BASE_URL}ban/${id}`, {
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body,
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
				error: "Ban Failed",
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
					"You are not authorized to perform that action",
				success: false,
				output: undefined,
				response,
			};
		}

		const check = checkAuthenticationError(response);
		if (check) {
			return check;
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
