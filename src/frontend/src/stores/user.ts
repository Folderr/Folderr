import { defineStore } from "pinia";
import { setUser } from "@sentry/vue";
import * as api from "../wrappers/api.js";
import type { AccountReturn } from "../../../types/user.js";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface UserStore {
	id?: string;
	username?: string;
	email?: string;
	createdAt?: Date;
	notifications: Array<{
		id: string;
		title: string;
		notify: string;
		createdAt: Date;
	}>;
	owner: boolean;
	admin: boolean;
	privacy: {
		dataCollection: boolean;
	};
}

export const useUserStore = defineStore("user", {
	state: (): UserStore => ({
		id: undefined,
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
	actions: {
		async loadUser() {
			if (!this.id) {
				try {
					const user = await api.fetchUser();
					if (user.user) {
						this.setUser(user.user);
					}
				} catch (error: unknown) {
					throw error as Error;
				}
			}
		},
		setUser(payload: AccountReturn) {
			this.id = payload.id;
			this.username = payload.username;
			this.email = payload.email;
			this.createdAt = new Date(payload.createdAt);
			this.notifications = payload.notifications;
			this.admin = payload.admin;
			this.owner = payload.owner;
			if (payload.privacy?.dataCollection) {
				// Typescript plz.
				this.privacy = payload.privacy as { dataCollection: boolean };
			}

			if (this.privacy.dataCollection) {
				setUser({
					id: this.id,
					username: this.username,
				});
			}
		},
		clear() {
			this.$reset();
		},
	},
});

/* If (import.meta.hot) {
	 import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
} */
