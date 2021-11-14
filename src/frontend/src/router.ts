import {createRouter, createWebHistory} from 'vue-router';

import * as userGuards from './nav-gaurds/user-nav-guard';

// Pages

import Index from './pages/Index.vue';
import Login from './pages/login.vue';
import NotFound from './pages/404.vue';
import Account from './pages/Account.vue';

const routes = [
	{
		path: '/',
		component: Index,
		beforeEnter: userGuards.authGuard
	},
	{
		path: '/login',
		component: Login,
		beforeEnter: userGuards.authGuard
	},
	{
		path: '/account',
		component: Account,
		beforeEnter: userGuards.authGuard
	},
	{
		path: '/:pathMatch(.*)*',
		component: NotFound
	}
];

const router = createRouter({
	history: createWebHistory(),
	routes
});

export default router;
