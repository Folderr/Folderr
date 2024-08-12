import type { RouteLocationNormalized } from "vue-router";
import { useUserStore } from "../stores/user.js";

export async function adminAuthGuard(to: RouteLocationNormalized) {
	if (to.name === "NotFound" || to.name === "NotFoundWild") {
		return true;
	}

	try {
		const store = useUserStore();
		if (!store.id) {
			await store.loadUser();
		}

		if (!store.id || !store.admin) {
			return { name: "NotFound" };
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
