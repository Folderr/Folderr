/* eslint-disable @typescript-eslint/promise-function-async */
import {
	type RouteRecordRaw,
	type RouteRecordName,
	createRouter,
	createWebHistory,
} from "vue-router";

// Navigation guards guards

import * as userGuards from "./nav-gaurds/user-nav-guard.js";
import * as adminNavGuards from "./nav-gaurds/admin-nav-guard.js";
import * as userChecks from "./nav-gaurds/user-checks.js";

const redirToSignup: RouteRecordName[] = [
	"Index",
	"Signup",
	"Account",
	"Upload File",
	"Shorten Link",
];

const routes: RouteRecordRaw[] = [
	{
		path: "/",
		component: () => import("./pages/Index.vue"),
		name: redirToSignup[0],
		beforeEnter: userGuards.authGuard,
	},
	{
		path: "/signup",
		component: () => import("./pages/Signup/Signup.vue"),
		beforeEnter: userGuards.authGuard,
		name: redirToSignup[1],
	},
	{
		path: "/account",
		component: () => import("./pages/Account/Account.vue"),
		name: redirToSignup[2],
		beforeEnter: userGuards.authGuard,
	},
	{
		path: "/account/farewell",
		component: () => import("./pages/Account/Farewell.vue"),
		name: "farewell",
	},
	{
		path: "/upload",
		component: () => import("./pages/Upload.vue"),
		name: redirToSignup[3],
		beforeEnter: userGuards.authGuard,
	},
	{
		path: "/shorten",
		component: () => import("./pages/Shorten.vue"),
		name: redirToSignup[4],
		beforeEnter: userGuards.authGuard,
	},
	{
		path: "/admin/users",
		component: () => import("./pages/Admin/Users.vue"),
		name: "Users",
		beforeEnter: adminNavGuards.adminAuthGuard,
	},
	{
		path: "/account/verify/:userid/:token",
		component: () => import("./pages/Verification/Verify.vue"),
		beforeEnter: userGuards.inverseAuthGuard,
		name: "Verify Self",
	},
	{
		path: "/account/deny/:userid/:token",
		component: () => import("./pages/Verification/Deny.vue"),
		beforeEnter: userGuards.inverseAuthGuard,
		name: "Deny Self",
	},
	{
		path: "/signup/success",
		component: () => import("./pages/Signup/Success.vue"),
		beforeEnter: userGuards.inverseAuthGuard,
		name: "Signup Success",
	},
	{
		path: "/signup/failed",
		component: () => import("./pages/Signup/Success.vue"),
		beforeEnter: userGuards.inverseAuthGuard,
		name: "Signup Failed",
	},
	{
		path: "/404",
		component: () => import("./pages/404.vue"),
		name: "NotFound",
		beforeEnter: userChecks.getUser,
	},
	{
		path: "/:pathMatch((?<!api\\).*)*",
		name: "NotFoundWild",
		component: () => import("./pages/404.vue"),
		redirect(to) {
			if (to.name && redirToSignup.includes(to.name)) {
				return { name: "Index" };
			}

			return { name: "NotFound" };
		},
		children: [],
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
