import {AccountReturn} from '../../../types/user';

type GenericFetchReturn<T = void> =
	| {error: string | Error; success: false; response?: Response; message: null}
	| {error: null; success: true; response?: Response; output?: T};

type UserReturn =
	| {error: string | Error; user: null}
	| {error: null; user: AccountReturn};

type ArrayFetchReturn<T> =
	| {error: string | Error; response?: Response; success: false; message: null}
	| {error: null; success: true; response?: Response; message: T[]};

export async function login(
	username: string,
	password: string,
): Promise<GenericFetchReturn> {
	try {
		const response = await fetch('/api/authorize', {
			method: 'POST',
			headers: {
				username,
				password,
			},
			credentials: 'same-origin',
		});
		if (response.status === 400) {
			if (import.meta.env.DEV) {
				console.log('DEBUG Response');
				console.log(response);
			}

			return {error: 'Bad Request', success: false, message: null};
		}

		if (response.status === 401) {
			return {error: 'Unauthorized', success: false, message: null};
		}

		if (/5\d{2}/.test(response.status.toString())) {
			return {error: 'Internal Server Error', success: false, message: null};
		}

		if (/2\d{2}/.test(response.status.toString())) {
			return {success: true, error: null};
		}

		return {success: false, error: 'An unknown error occurred', message: null};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
		}

		return {error: 'An unknown error occurred', success: false, message: null};
	}
}

export async function fetchUser(): Promise<UserReturn> {
	try {
		const response = await fetch('/api/account');
		if (response.status === 401 || response.status === 400) {
			return {error: 'Unauthorized', user: null};
		}

		if (!/2\d{2}/.test(response.status.toString())) {
			return {error: 'Request failed', user: null};
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const output: {code: number; message: AccountReturn} =
			await response.json();
		return {error: null, user: output.message};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
		}

		return {error: 'An unknown error occurred', user: null};
	}
}

type UpdateInfoParameterOptions =
	| {username: string; email?: string}
	| {email: string; username?: string};

export async function updateInfo(
	input: UpdateInfoParameterOptions,
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
		const response = await fetch('/api/account', {
			method: 'PATCH',
			body: JSON.stringify(info),
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return {error: null, success: true};
		}

		if (response.status === 401) {
			return {error: 'Unauthorized', success: false, message: null};
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error: output?.message ?? 'Bad Request',
				success: false,
				message: null,
			};
		}

		if (response.status === 226) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error:
					output?.message ?? 'Something you entered is in use by another user',
				success: false,
				message: null,
			};
		}

		if (response.status === 501) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error: output?.message ?? 'Method, resource, or action not implemented',
				success: false,
				message: null,
			};
		}

		if (import.meta.env.DEV) {
			console.log('DEBUG Response from API/Update Account');
			console.log(response);
		}

		return {error: 'Unknown Response', success: false, response, message: null};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		console.log(error);

		return {error: 'An unknown error occurred', success: false, message: null};
	}
}

export async function updatePassword(info: {
	newPassword: string;
	password: string;
}): Promise<GenericFetchReturn> {
	if (info.password === info.newPassword) {
		return {
			success: false,
			error: 'Passwords cannot be the same',
			message: null,
		};
	}

	try {
		const response = await fetch('/api/account', {
			method: 'PATCH',
			body: JSON.stringify({password: info.newPassword}),
			headers: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			credentials: 'same-origin',
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return {error: null, success: true};
		}

		if (response.status === 401) {
			return {error: 'Unauthorized', success: false, message: null};
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error: output?.message ?? 'Bad Request',
				success: false,
				message: null,
			};
		}

		if (response.status === 226) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error:
					output?.message ?? 'Something you entered is in use by another user',
				success: false,
				message: null,
			};
		}

		if (response.status === 501) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error: output?.message ?? 'Method, resource, or action not implemented',
				success: false,
				message: null,
			};
		}

		if (import.meta.env.DEV) {
			console.log('DEBUG Response from API/Update Account Password');
			console.log(response);
		}

		return {error: 'Unknown Response', success: false, response, message: null};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		console.log(error);

		return {error: 'An unknown error occurred', success: false, message: null};
	}
}

export async function logoutEverywhere(): Promise<GenericFetchReturn> {
	try {
		const response = await fetch('/api/logout?everywhere=true', {
			credentials: 'same-origin',
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: null,
				success: true,
			};
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error: output?.message ?? 'Could not log out (likely developer error)',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 401) {
			return {
				error: 'Unauthorized',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 500) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error: output?.message ?? 'Could not log out (likely issue with host)',
				success: false,
				response,
				message: null,
			};
		}

		if (import.meta.env.DEV) {
			console.log('DEBUG Response from API/Logout Everywhere');
			console.log(response);
		}

		return {error: 'Unknown Response', success: false, response, message: null};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		console.log(error);

		return {error: 'An unknown error occurred', success: false, message: null};
	}
}

export async function logout(): Promise<GenericFetchReturn> {
	try {
		const response = await fetch('/api/logout', {
			credentials: 'same-origin',
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: null,
				success: true,
			};
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error: output?.message ?? 'Could not log out (likely developer error)',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 500) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					'Could not log out (likely issue with host/server)',
				success: false,
				response,
				message: null,
			};
		}

		if (import.meta.env.DEV) {
			console.log('DEBUG Response from API/Logout');
			console.log(response);
		}

		return {error: 'Unknown Response', success: false, response, message: null};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		console.log(error);

		return {error: 'An unknown error occurred', success: false, message: null};
	}
}

export async function deleteAccount(
	userID?: string,
): Promise<GenericFetchReturn> {
	let url = '/api/account';
	if (userID) {
		url += `?userid=${userID}`;
	}

	try {
		const response = await fetch(url, {
			credentials: 'same-origin',
			method: 'DELETE',
		});

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: null,
				success: true,
			};
		}

		if (response.status === 400) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					'Could not delete account (likely developer error)',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 401) {
			return {
				error: 'Unauthorized',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 403) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error: output?.message ?? 'Forbidden from deleting that account',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 500) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const output: {message: string; code: number} | undefined =
				await response.json();
			return {
				error:
					output?.message ??
					'Could not delete account (likely issue with server)',
				success: false,
				response,
				message: null,
			};
		}

		if (import.meta.env.DEV) {
			console.log('DEBUG Response from API/Delete Account');
			console.log(response);
		}

		return {error: 'Unknown Response', success: false, response, message: null};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		console.log(error);

		return {error: 'An unknown error occurred', success: false, message: null};
	}
}

export interface Token {
	id: string;
	userID: string;
	web?: boolean;
	created: number;
	description: string;
}

export async function getTokens(): Promise<ArrayFetchReturn<Token>> {
	try {
		const response = await fetch('/api/account/tokens', {
			credentials: 'same-origin',
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: {code: number; message: string | Token[]} | undefined =
			await response.json();

		if (response.status === 400) {
			return {
				success: false,
				error:
					typeof body?.message === 'string' ? body?.message : 'Bad Request',
				response,
				message: null,
			};
		}

		if (response.status === 401) {
			return {
				success: false,
				error:
					typeof body?.message === 'string' ? body?.message : 'Unauthorized',
				message: null,
			};
		}

		if (response.status === 500) {
			return {
				success: false,
				error: 'A internal server occured',
				response,
				message: null,
			};
		}

		if (
			/2\d{2}/.test(response.status.toString()) &&
			body &&
			typeof body.message !== 'string'
		) {
			return {
				success: true,
				message: body.message,
				error: null,
			};
		}

		return {
			success: false,
			error: 'An unknown error occured',
			response,
			message: null,
		};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		if (error instanceof Error) {
			return {
				success: false,
				error,
				message: null,
			};
		}

		if (typeof error === 'string') {
			return {
				success: false,
				error,
				message: null,
			};
		}

		console.log(error);

		return {
			success: false,
			error: 'An unknown error occured',
			message: null,
		};
	}
}

export async function createToken(
	description: string,
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch('/api/account/token', {
			method: 'POST',
			credentials: 'same-origin',
			body: JSON.stringify({description}),
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: {code: number; message: string} | undefined =
			await response.json();

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: null,
				success: true,
				output: body?.message,
			};
		}

		if (response.status === 500) {
			return {
				error: body?.message ?? 'An internal server error occurred',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 401) {
			return {
				error: body?.message ?? 'Unauthorized',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 400) {
			return {
				error: body?.message ?? 'Bad Request',
				success: false,
				response,
				message: null,
			};
		}

		return {
			error: body?.message ?? 'An unknown error occurred',
			success: false,
			response,
			message: null,
		};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		if (error instanceof Error) {
			return {
				success: false,
				error,
				message: null,
			};
		}

		if (typeof error === 'string') {
			return {
				success: false,
				error,
				message: null,
			};
		}

		console.log(error);

		return {
			success: false,
			error: 'An unknown error occured',
			message: null,
		};
	}
}

export async function revokeToken(
	id: string,
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch(`/api/account/token/${id}`, {
			method: 'DELETE',
			credentials: 'same-origin',
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: {code: number; message: string} | undefined =
			await response.json();

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: null,
				success: true,
				output: body?.message,
			};
		}

		if (response.status === 500) {
			return {
				error: body?.message ?? 'An internal server error occurred',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 401) {
			return {
				error: body?.message ?? 'Unauthorized',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 400) {
			return {
				error: body?.message ?? 'Bad Request',
				success: false,
				response,
				message: null,
			};
		}

		return {
			error: body?.message ?? 'An unknown error occurred',
			success: false,
			response,
			message: null,
		};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		if (error instanceof Error) {
			return {
				success: false,
				error,
				message: null,
			};
		}

		if (typeof error === 'string') {
			return {
				success: false,
				error,
				message: null,
			};
		}

		console.log(error);

		return {
			success: false,
			error: 'An unknown error occured',
			message: null,
		};
	}
}

export async function uploadFile(
	data: FormData,
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch('/api/file', {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		});

		console.log(response.headers.get('content-type'));

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: null,
				success: true,
				output: await response.text(),
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: {code: number; message: string} | undefined =
			await response.json();
		if (response.status === 500) {
			return {
				error: body?.message ?? 'An internal server error occurred',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 401) {
			return {
				error: body?.message ?? 'Unauthorized',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 400) {
			return {
				error: body?.message ?? 'Bad Request',
				success: false,
				response,
				message: null,
			};
		}

		console.log('what');
		return {
			error: body?.message ?? 'An unknown error occurred',
			success: false,
			response,
			message: null,
		};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		if (error instanceof Error) {
			return {
				success: false,
				error,
				message: null,
			};
		}

		if (typeof error === 'string') {
			return {
				success: false,
				error,
				message: null,
			};
		}

		console.log(error);

		return {
			success: false,
			error: 'An unknown error occured',
			message: null,
		};
	}
}

export async function shortenLink(
	url: URL,
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch('/api/link', {
			method: 'POST',
			credentials: 'same-origin',
			body: JSON.stringify({url}),
			headers: {
				'Content-Type': 'application/json',
			},
		});

		console.log(response.headers.get('content-type'));

		if (/2\d{2}/.test(response.status.toString())) {
			return {
				error: null,
				success: true,
				output: await response.text(),
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body: {code: number; message: string} | undefined =
			await response.json();
		if (response.status === 500) {
			return {
				error: body?.message ?? 'An internal server error occurred',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 404 || response.status === 406) {
			return {
				error: body?.message ?? 'URL Not Accepted',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 401) {
			return {
				error: body?.message ?? 'Unauthorized',
				success: false,
				response,
				message: null,
			};
		}

		if (response.status === 400) {
			return {
				error: body?.message ?? 'Bad Request',
				success: false,
				response,
				message: null,
			};
		}

		console.log(response.status);

		return {
			error: body?.message ?? 'An unknown error occurred',
			success: false,
			response,
			message: null,
		};
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			error.message === 'Failed to fetch' &&
			import.meta.env.DEV
		) {
			console.log(
				`DEBUG Error Name: ${error.name}\nDEBUG Error: ${error.message}`,
			);
			console.log(error);
		}

		if (error instanceof Error) {
			return {
				success: false,
				error,
				message: null,
			};
		}

		if (typeof error === 'string') {
			return {
				success: false,
				error,
				message: null,
			};
		}

		console.log(error);

		return {
			success: false,
			error: 'An unknown error occured',
			message: null,
		};
	}
}
