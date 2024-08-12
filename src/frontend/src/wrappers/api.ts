import * as Sentry from "@sentry/vue";
import type { AccountReturn } from "../../../types/user.js";

type GenericFetchReturn<T = void> =
	| {
			error: string | Error;
			success: false;
			response?: Response;
			output: undefined;
	  }
	| { error: undefined; success: true; response?: Response; output?: T };

type UserReturn =
	| { error: string | Error; user: undefined }
	| { error: undefined; user: AccountReturn };

type ArrayFetchReturn<T> =
	| {
			error: string | Error;
			response?: Response;
			success: false;
			message: undefined;
	  }
	| { error: undefined; success: true; response?: Response; message: T[] };

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

	console.log(error);

	return {
		error: "An unknown error occurred",
		success: false,
		output: undefined,
	};
}

export async function signup(
	username: string,
	password: string,
	email: string
) {
	try {
		const response = await fetch("/api/signup", {
			method: "POST",
			body: JSON.stringify({
				username,
				password,
				email,
			}),
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (response.status === 400) {
			if (import.meta.env.DEV) {
				console.log("DEBUG Response");
				console.log(response);
			}

			return { error: "Bad Request", success: false, output: undefined };
		}

		if (response.status === 423) {
			return {
				error: "Signups Closed",
				success: false,
				output: undefined,
			};
		}

		if (response.status === 401) {
			return { error: "Unauthorized", success: false, output: undefined };
		}

		if (/5\d{2}/.test(response.status.toString())) {
			return {
				error: "Internal Server Error",
				success: false,
				output: undefined,
			};
		}

		if (/2\d{2}/.test(response.status.toString())) {
			return { success: true, error: undefined };
		}

		return {
			success: false,
			error: "An unknown error occurred",
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function login(
	username: string,
	password: string
): Promise<GenericFetchReturn> {
	try {
		const response = await fetch("/api/authorize", {
			method: "POST",
			headers: {
				username,
				password,
			},
			credentials: "same-origin",
		});
		if (response.status === 400) {
			if (import.meta.env.DEV) {
				console.log("DEBUG Response");
				console.log(response);
			}

			return { error: "Bad Request", success: false, output: undefined };
		}

		if (response.status === 401) {
			return { error: "Unauthorized", success: false, output: undefined };
		}

		if (/5\d{2}/.test(response.status.toString())) {
			return {
				error: "Internal Server Error",
				success: false,
				output: undefined,
			};
		}

		if (/2\d{2}/.test(response.status.toString())) {
			return { success: true, error: undefined };
		}

		return {
			success: false,
			error: "An unknown error occurred",
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function fetchUser(): Promise<UserReturn> {
	try {
		const response = await fetch("/api/account");
		if (response.status === 401 || response.status === 400) {
			return { error: "Unauthorized", user: undefined };
		}

		if (!/2\d{2}/.test(response.status.toString())) {
			return { error: "Request failed", user: undefined };
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const output: { code: number; message: AccountReturn } =
			await response.json();
		return { error: undefined, user: output.message };
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

		return { error: "An unknown error occurred", user: undefined };
	}
}

type UpdateInfoParameterOptions =
	| { username: string; email?: string }
	| { email: string; username?: string };

export async function updateInfo(
	input: UpdateInfoParameterOptions
): Promise<GenericFetchReturn> {
	const info: {
		username?: string;
		email?: string;
	} = {};
	if (input.username) {
		info.username = input.username;
	}

	if (input.email) {
		info.email = input.email;
	}

	try {
		const response = await fetch("/api/account", {
			method: "PATCH",
			body: JSON.stringify(info),
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (response.status === 226) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Something you entered is in use by another user",
				success: false,
				output: undefined,
			};
		}

		if (/2\d{2}/.test(response.status.toString())) {
			return { error: undefined, success: true };
		}

		if (response.status === 401) {
			return { error: "Unauthorized", success: false, output: undefined };
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error: output?.message ?? "Bad Request",
				success: false,
				output: undefined,
			};
		}

		if (response.status === 406) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error: output?.message ?? "Forbidden Action Attempted",
				success: false,
				output: undefined,
			};
		}

		if (response.status === 501) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Method, resource, or action not implemented",
				success: false,
				output: undefined,
			};
		}

		if (import.meta.env.DEV) {
			console.log("DEBUG Response from API/Update Account");
			console.log(response);
		}

		return {
			error: "Unknown Response",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function updatePassword(info: {
	newPassword: string;
	password: string;
}): Promise<GenericFetchReturn> {
	if (info.password === info.newPassword) {
		return {
			success: false,
			error: "Passwords cannot be the same",
			output: undefined,
		};
	}

	try {
		const response = await fetch("/api/account", {
			method: "PATCH",
			body: JSON.stringify({ password: info.newPassword }),
			headers: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			credentials: "same-origin",
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return { error: undefined, success: true };
		}

		if (response.status === 401) {
			return { error: "Unauthorized", success: false, output: undefined };
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error: output?.message ?? "Bad Request",
				success: false,
				output: undefined,
			};
		}

		if (response.status === 501) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Method, resource, or action not implemented",
				success: false,
				output: undefined,
			};
		}

		if (import.meta.env.DEV) {
			console.log("DEBUG Response from API/Update Account Password");
			console.log(response);
		}

		return {
			error: "Unknown Response",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

type PrivacyUpdateOptions = {
	dataCollection: boolean;
};

export async function updatePrivacy(
	info: PrivacyUpdateOptions
): Promise<GenericFetchReturn> {
	try {
		const response = await fetch("/api/account", {
			method: "PATCH",
			body: JSON.stringify({ privacy: info }),
			headers: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			credentials: "same-origin",
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return { error: undefined, success: true };
		}

		if (response.status === 401) {
			return { error: "Unauthorized", success: false, output: undefined };
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error: output?.message ?? "Bad Request",
				success: false,
				output: undefined,
			};
		}

		if (response.status === 501) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Method, resource, or action not implemented",
				success: false,
				output: undefined,
			};
		}

		if (import.meta.env.DEV) {
			console.log("DEBUG Response from API/Update Account Password");
			console.log(response);
		}

		return {
			error: "Unknown Response",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function logoutEverywhere(): Promise<GenericFetchReturn> {
	try {
		const response = await fetch("/api/logout?everywhere=true", {
			credentials: "same-origin",
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: undefined,
				success: true,
			};
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Could not log out (likely developer error)",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 401) {
			return {
				error: "Unauthorized",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 500) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Could not log out (likely issue with host)",
				success: false,
				response,
				output: undefined,
			};
		}

		if (import.meta.env.DEV) {
			console.log("DEBUG Response from API/Logout Everywhere");
			console.log(response);
		}

		return {
			error: "Unknown Response",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function logout(): Promise<GenericFetchReturn> {
	try {
		const response = await fetch("/api/logout", {
			credentials: "same-origin",
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: undefined,
				success: true,
			};
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Could not log out (likely developer error)",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 500) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Could not log out (likely issue with host/server)",
				success: false,
				response,
				output: undefined,
			};
		}

		if (import.meta.env.DEV) {
			console.log("DEBUG Response from API/Logout");
			console.log(response);
		}

		return {
			error: "Unknown Response",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function deleteAccount(
	userID?: string
): Promise<GenericFetchReturn> {
	let url = "/api/account";
	if (userID) {
		url += `?userid=${userID}`;
	}

	try {
		const response = await fetch(url, {
			credentials: "same-origin",
			method: "DELETE",
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: undefined,
				success: true,
			};
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Could not delete account (likely developer error)",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 401) {
			return {
				error: "Unauthorized",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 403) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ?? "Forbidden from deleting that account",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 500) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: { message: string; code: number } | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					"Could not delete account (likely issue with server)",
				success: false,
				response,
				output: undefined,
			};
		}

		if (import.meta.env.DEV) {
			console.log("DEBUG Response from API/Delete Account");
			console.log(response);
		}

		return {
			error: "Unknown Response",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export type Token = {
	id: string;
	userID: string;
	web?: boolean;
	created: number;
	description: string;
};

export async function getTokens(): Promise<ArrayFetchReturn<Token>> {
	try {
		const response = await fetch("/api/account/tokens", {
			credentials: "same-origin",
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: { code: number; message: string | Token[] } | undefined =
			await response.json();

		if (response.status === 400) {
			return {
				success: false,
				error:
					typeof body?.message === "string"
						? body?.message
						: "Bad Request",
				response,
				message: undefined,
			};
		}

		if (response.status === 401) {
			return {
				success: false,
				error:
					typeof body?.message === "string"
						? body?.message
						: "Unauthorized",
				message: undefined,
			};
		}

		if (response.status === 500) {
			return {
				success: false,
				error: "A internal server occured",
				response,
				message: undefined,
			};
		}

		if (
			/2\d{2}/.test(response.status.toString()) &&
			body &&
			typeof body.message !== "string"
		) {
			return {
				success: true,
				message: body.message,
				error: undefined,
			};
		}

		return {
			success: false,
			error: "An unknown error occured",
			response,
			message: undefined,
		};
	} catch (error: unknown) {
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
			return {
				success: false,
				error,
				message: undefined,
			};
		}

		if (typeof error === "string") {
			return {
				success: false,
				error,
				message: undefined,
			};
		}

		console.log(error);

		return {
			success: false,
			error: "An unknown error occured",
			message: undefined,
		};
	}
}

export async function createToken(
	description: string
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch("/api/account/token", {
			method: "POST",
			credentials: "same-origin",
			body: JSON.stringify({ description }),
			headers: {
				"Content-Type": "application/json",
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: { code: number; message: string } | undefined =
			await response.json();

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: undefined,
				success: true,
				output: body?.message,
			};
		}

		if (response.status === 500) {
			return {
				error: body?.message ?? "An internal server error occurred",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 401) {
			return {
				error: body?.message ?? "Unauthorized",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 400) {
			return {
				error: body?.message ?? "Bad Request",
				success: false,
				response,
				output: undefined,
			};
		}

		return {
			error: body?.message ?? "An unknown error occurred",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch<string>(error);
	}
}

export async function revokeToken(
	id: string
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch(`/api/account/token/${id}`, {
			method: "DELETE",
			credentials: "same-origin",
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: { code: number; message: string } | undefined =
			await response.json();

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: undefined,
				success: true,
				output: body?.message,
			};
		}

		if (response.status === 500) {
			return {
				error: body?.message ?? "An internal server error occurred",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 401) {
			return {
				error: body?.message ?? "Unauthorized",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 400) {
			return {
				error: body?.message ?? "Bad Request",
				success: false,
				response,
				output: undefined,
			};
		}

		return {
			error: body?.message ?? "An unknown error occurred",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function uploadFile(
	data: FormData
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch("/api/file", {
			method: "POST",
			credentials: "same-origin",
			body: data,
		});

		console.log(response.headers.get("content-type"));

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: undefined,
				success: true,
				output: await response.text(),
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: { code: number; message: string } | undefined =
			await response.json();
		if (response.status === 500) {
			return {
				error: body?.message ?? "An internal server error occurred",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 401) {
			return {
				error: body?.message ?? "Unauthorized",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 400) {
			return {
				error: body?.message ?? "Bad Request",
				success: false,
				response,
				output: undefined,
			};
		}

		console.log("what");
		return {
			error: body?.message ?? "An unknown error occurred",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}

export async function shortenLink(
	url: URL
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch("/api/link", {
			method: "POST",
			credentials: "same-origin",
			body: JSON.stringify({ url }),
			headers: {
				"Content-Type": "application/json",
			},
		});

		console.log(response.headers.get("content-type"));

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: undefined,
				success: true,
				output: await response.text(),
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: { code: number; message: string } | undefined =
			await response.json();
		if (response.status === 500) {
			return {
				error: body?.message ?? "An internal server error occurred",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 404 || response.status === 406) {
			return {
				error: body?.message ?? "URL Not Accepted",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 401) {
			return {
				error: body?.message ?? "Unauthorized",
				success: false,
				response,
				output: undefined,
			};
		}

		if (response.status === 400) {
			return {
				error: body?.message ?? "Bad Request",
				success: false,
				response,
				output: undefined,
			};
		}

		console.log(response.status);

		return {
			error: body?.message ?? "An unknown error occurred",
			success: false,
			response,
			output: undefined,
		};
	} catch (error: unknown) {
		return genericCatch(error);
	}
}
