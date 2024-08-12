import {
	httpCodes,
	badResponseHandler,
	type GenericFetchReturn,
	genericCatch,
} from "../utils/request-helpers.js";

// eslint-disable-next-line @typescript-eslint/naming-convention
const BASE_URL = "/api/manage/";

export async function promoteUserToAdmin(
	id: string
): Promise<GenericFetchReturn<string>> {
	try {
		const response = await fetch(`${BASE_URL}admin/${id}`, {
			credentials: "same-origin",
			method: "POST",
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

		const check = await badResponseHandler(response, {});
		if (check) {
			return check;
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
