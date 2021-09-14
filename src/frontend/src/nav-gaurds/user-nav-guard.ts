import {RouteLocationNormalized} from 'vue-router';

export async function authGuard(
	to: RouteLocationNormalized
): Promise<string | boolean | Error> {
	if (to.name === 'NotFound') {
		return true;
	}

	try {
		const response = await fetch('/api/account');
		if (response.status !== 200) {
			return '/404';
		}

		if (to.path === '/login' || to.path === '/') {
			return '/account';
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
