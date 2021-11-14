import {RouteLocationNormalized} from 'vue-router';
import * as api from '../wrappers/api';

export async function authGuard(
	to: RouteLocationNormalized
): Promise<string | boolean | Error> {
	if (to.name === 'NotFound') {
		return true;
	}

	try {
		const response = await api.fetchUser();
		if (response.error && !['/login', '/'].includes(to.path)) {
			return '/404';
		}

		if ((to.path === '/login' || to.path === '/') && !response.error) {
			return '/account';
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
