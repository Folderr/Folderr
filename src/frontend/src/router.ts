/* eslint-disable @typescript-eslint/promise-function-async */
import {createRouter, createWebHistory} from 'vue-router';

// Navigation guards guards

import * as userGuards from './nav-gaurds/user-nav-guard';
import * as adminNavGuards from './nav-gaurds/admin-nav-guard';
import * as userChecks from './nav-gaurds/user-checks';

const routes = [
	{
		path: '/',
		component: () => import('./pages/Index.vue'),
		beforeEnter: userGuards.authGuard,
	},
	{
		path: '/signup',
		component: () => import('./pages/Signup.vue'),
		beforeEnter: userGuards.authGuard
	},
	{
		path: '/account',
		component: () => import('./pages/Account.vue'),
		beforeEnter: userGuards.authGuard,
	},
	{
		path: '/upload',
		component: () => import('./pages/Upload.vue'),
		beforeEnter: userGuards.authGuard,
	},
	{
		path: '/shorten',
		component: () => import('./pages/Shorten.vue'),
		beforeEnter: userGuards.authGuard,
	},
	{
		path: '/admin',
		component: () => import('./pages/Admin.vue'),
		beforeEnter: adminNavGuards.adminAuthGuard,
	},
	{
		path: '/:pathMatch(.*)*',
		component: () => import('./pages/404.vue'),
		beforeEnter: userChecks.getUser,
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
