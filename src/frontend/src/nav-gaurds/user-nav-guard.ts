import type {RouteLocationNormalized} from 'vue-router';
import {useUserStore} from '../stores/user';

export async function authGuard(
	to: RouteLocationNormalized,
): Promise<string | boolean | Error> {
	if (to.name === 'NotFound') {
		return true;
	}

	try {
		const store = useUserStore();
		if (!store.id) {
			await store.loadUser();
		}

		if ((to.path === '/login' || to.path === '/') && store.id) {
			return '/account';
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
