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
	owner?: boolean;
}

const usermod: Module<UserStore, unknown> = {
	namespaced: true,
	state: () => ({
		userID: undefined,
		username: undefined,
		email: undefined,
		createdAt: undefined,
		notifications: [],
		owner: false
	}),
	mutations: {
		setUserinfo(state: UserStore, info: UserStore) {
			state.userID = info.userID;
			state.createdAt = info.createdAt;
			state.email = info.email;
			state.notifications = info.notifications;
			state.owner = info.owner;
			state.username = info.username;
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
		}
	}
};

export default usermod;
