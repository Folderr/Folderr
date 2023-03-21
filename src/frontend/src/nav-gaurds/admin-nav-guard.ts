import type {RouteLocationNormalized} from 'vue-router';
import {useUserStore} from '../stores/user';

export async function adminAuthGuard(
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

		if (!store.id || !store.admin) {
			return '/404';
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
