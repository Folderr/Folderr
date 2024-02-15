import {
	httpCodes,
	badResponseHandler,
	type GenericFetchReturn,
	genericCatch,
	requestHelper,
} from "../utils/request-helpers";

// eslint-disable-next-line @typescript-eslint/naming-convention
const BASE_URL = "/api/admin/";

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
		const check = await badResponseHandler(response, {});
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
	const dbNotFound = 1054;
	const output = await requestHelper<AdminUsersReturn[] | string>(
		`${BASE_URL}users`,
		"GET",
		"Array",
		{
			altCode: dbNotFound,
			altMessage: "No users found",
		}
	);
	if (output.error) {
		if (output.error instanceof Error) {
			throw output.error;
		}

		throw new Error(output.error);
	}

	console.log(output);
	return output;
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
		const check = await badResponseHandler(response, {});
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

		const check = await badResponseHandler(response, {});
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

		const check = await badResponseHandler(response, {
			notFound: "Account not found",
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

		const check = await badResponseHandler(response, {
			notFound: "User not found",
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

		const check = await badResponseHandler(response, {
			notAccepted: "Warn Failed",
			notFound: "User Not Found",
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

		const check = await badResponseHandler(response, {
			notAccepted: "Ban Failed",
			notFound: "User Not Found",
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
