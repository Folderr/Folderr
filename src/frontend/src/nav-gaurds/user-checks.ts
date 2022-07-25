import {RouteLocationNormalized} from 'vue-router';
import * as api from '../wrappers/api';
import store from '../store';

export async function getUser(
	to: RouteLocationNormalized,
): Promise<string | boolean | Error> {
	if (to.name === 'NotFound') {
		return true;
	}

	try {
		const response = await api.fetchUser();

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
			});
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
