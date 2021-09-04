import {createRouter, createWebHistory} from 'vue-router';

// Pages

import Index from './pages/Index.vue';
import Login from './pages/login.vue';
import NotFound from './pages/404.vue';

const routes = [
	{
		path: '/',
		component: Index
	},
	{
		path: '/login',
		component: Login
	},
	{
		path: '/404',
		component: NotFound
	}
];

const router = createRouter({
	history: createWebHistory(),
	routes
});

export default router;
