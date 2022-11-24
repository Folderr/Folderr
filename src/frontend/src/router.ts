import {createRouter, createWebHistory} from 'vue-router';

import * as userGuards from './nav-gaurds/user-nav-guard';
import * as adminNavGuards from './nav-gaurds/admin-nav-guard';
import * as userChecks from './nav-gaurds/user-checks';

// Pages

import Index from './pages/Index.vue';
import NotFound from './pages/404.vue';
import Account from './pages/Account.vue';
import Upload from './pages/Upload.vue';
import Shorten from './pages/Shorten.vue';
import Admin from './pages/Admin.vue';

const routes = [
	{
		path: '/',
		component: Index,
		beforeEnter: userGuards.authGuard,
	},
	{
		path: '/account',
		component: Account,
		beforeEnter: userGuards.authGuard,
	},
	{
		path: '/upload',
		component: Upload,
		beforeEnter: userGuards.authGuard,
	},
	{
		path: '/shorten',
		component: Shorten,
		beforeEnter: userGuards.authGuard,
	},
	{
		path: '/admin',
		component: Admin,
		beforeEnter: adminNavGuards.adminAuthGuard,
	},
	{
		path: '/:pathMatch(.*)*',
		component: NotFound,
		beforeEnter: userChecks.getUser,
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
