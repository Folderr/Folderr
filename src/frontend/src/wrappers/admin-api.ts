type GenericFetchReturn<T = void> =
	| {error: string | Error; success: false; response?: Response; output: null}
	| {error: null; success: true; response?: Response; output?: T};

interface Stats {
	users: number;
	links: number;
	files: number;
	bannedEmails: number;
	whitelistedEmails: number;
}

export async function getStats(): Promise<GenericFetchReturn<Stats>> {
	try {
		const response = await fetch('/api/admin/statistics', {
			method: 'GET',
			credentials: 'same-origin',
		});

		if (response.status === 401) {
			console.log('Hi from AdminAPI Wrapper L14');
			return {error: 'Unauthorized', success: false, output: null};
		}

		console.log('Hi from AdminAPI Wrapper L18');
		const output: {
			code: number;
			message: Stats;
		} = (await response.json()) as {code: number; message: Stats};
		return {error: null, success: true, output: output.message};
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

		console.log(error);
		console.log('Hi from AdminAPI Wrapper L32');
		return {error: 'An unknown error occurred', success: false, output: null};
	}
}
