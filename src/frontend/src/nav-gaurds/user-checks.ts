import type { RouteLocationNormalized } from "vue-router";
import { useUserStore } from "../stores/user.js";

export async function getUser(
	to: RouteLocationNormalized
): Promise<string | boolean | Error> {
	if (to.name === "NotFoundWild" || to.name === "NotFound") {
		return true;
	}

	try {
		const store = useUserStore();
		if (!store.id) {
			await store.loadUser();
		}

		if (!store.id) {
			return false;
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}

export async function noUser(to: RouteLocationNormalized) {
	try {
		const store = useUserStore();
		if (!store.id) {
			await store.loadUser();
		}

		if (store.id) {
			return "/account";
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
