import type {RouteLocationNormalized} from 'vue-router';
import * as api from '../wrappers/api';
import store from '../store';

export async function adminAuthGuard(
	to: RouteLocationNormalized,
): Promise<string | boolean | Error> {
	if (to.name === 'NotFound') {
		return true;
	}

	try {
		const response = await api.fetchUser();
		if (response.error ?? (response.user && !response.user.admin)) {
			return '/404';
		}

		if (response.user) {
			store.commit('user/setUserinfo', {
				email: response.user.email,
				username: response.user.username,
				// eslint-disable-next-line @typescript-eslint/naming-convention
				userID: response.user.id,
				createdAt: response.user.createdAt,
				notifications: response.user.notifications,
				owner: response.user.owner,
				admin: response.user.admin,
				privacy: response.user.privacy,
			});
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
