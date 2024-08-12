import type { RouteLocationNormalized } from "vue-router";
import { useUserStore } from "../stores/user.js";

export async function authGuard(
	to: RouteLocationNormalized
): Promise<string | boolean | Error> {
	if (to.name === "NotFound") {
		return true;
	}

	try {
		const store = useUserStore();
		if (!store.id) {
			await store.loadUser();
		}

		if ((to.path === "/login" || to.path === "/") && store.id) {
			return "/account";
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}

export async function inverseAuthGuard(
	to: RouteLocationNormalized
): Promise<string | boolean | Error> {
	if (to.name === "NotFound") {
		return true;
	}

	try {
		const store = useUserStore();
		if (!store.id) {
			await store.loadUser();
		}

		if (
			(to.path.includes("deny") ||
				to.path.includes("verify") ||
				to.path === "/signup/success" ||
				to.path === "/signup/failed") &&
			store.id
		) {
			return "/account";
		}

		return true;
	} catch (error: unknown) {
		return error as Error;
	}
}
