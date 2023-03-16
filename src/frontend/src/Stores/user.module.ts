import type {Module} from 'vuex';
import {setUser} from '@sentry/vue';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface UserStore {
	userID?: string;
	username?: string;
	email?: string;
	createdAt?: Date;
	notifications: Array<{
		id: string;
		title: string;
		notify: string;
		createdAt: Date;
	}>;
	owner?: boolean;
	admin?: boolean;
	privacy?: {
		dataCollection?: boolean;
	};
}

const usermod: Module<UserStore, unknown> = {
	namespaced: true,
	state: () => ({
		// eslint-disable-next-line @typescript-eslint/naming-convention
		userID: undefined,
		username: undefined,
		email: undefined,
		createdAt: undefined,
		notifications: [],
		owner: false,
		admin: false,
		privacy: {
			dataCollection: false,
		},
	}),
	mutations: {
		setUserinfo(state: UserStore, info: UserStore) {
			state.userID = info.userID;
			state.createdAt = info.createdAt;
			state.email = info.email;
			state.notifications = info.notifications;
			state.owner = info.owner;
			state.username = info.username;
			state.admin = info.admin;
			state.privacy = {
				dataCollection: info.privacy?.dataCollection,
			};
			if (state.privacy.dataCollection) {
				setUser({
					id: info.userID,
					username: info.username,
				});
			}
		},
		updateEmail(state: UserStore, email: string) {
			state.email = email;
		},
		reset(state: UserStore) {
			state.userID = undefined;
			state.username = undefined;
			state.email = undefined;
			state.createdAt = undefined;
			state.notifications = [];
			state.owner = false;
			state.admin = false;
		},
	},
};

export default usermod;
