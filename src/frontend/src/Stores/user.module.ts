import {Module} from 'vuex';

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
}

const usermod: Module<UserStore, unknown> = {
	namespaced: true,
	state: () => ({
		userID: undefined,
		username: undefined,
		email: undefined,
		createdAt: undefined,
		notifications: []
	}),
	mutations: {
		setUserinfo(state: UserStore, info: UserStore) {
			state = info;
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
		}
	}
};

export default usermod;
