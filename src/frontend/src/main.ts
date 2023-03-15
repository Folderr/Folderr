import * as Sentry from '@sentry/vue';
import type * as SentryTypes from '@sentry/types';
import {BrowserTracing} from '@sentry/tracing';
import {createApp} from 'vue';
import store from './store';
import router from './router';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';
import NavbarAuthenticated from './components/Navbar-Authenticated.vue';
import SuccessNErrors from './components/Success-N-Error.vue';
import Button from './components/Button.vue';

// Modals

import FlexibleModal from './components/Modals/Flexible.vue';
import NewFlexible from './components/Modals/NewFlexible.vue';

import App from './App.vue';

import './index.css';

const app = createApp(App);

// Init sentry, if available.

if (import.meta.env.VITE_SENTRY) {
	let options: Record<string, any> = {
		dsn: import.meta.env.VITE_SENTRY,
	};
	if (import.meta.env.VITE_SENTRY_TRACING) {
		const rate =
			import.meta.env.VITE_SENTRY_RATE >= 1 &&
			import.meta.env.VITE_SENTRY_RATE <= 0
				? import.meta.env.VITE_SENTRY_RATE
				: undefined;
		options = {
			...options,
			integrations: [
				new BrowserTracing({
					routingInstrumentation: Sentry.vueRouterInstrumentation(router),
				}),
			],
			tracesSampleRate: rate ?? import.meta.env.DEV ? 1 : 0.2,
		};
	}

	if (import.meta.env.VITE_SENTRY_REPLAY) {
		const rate =
			import.meta.env.VITE_SENTRY_REPLAY_RATE >= 1 &&
			import.meta.env.VITE_SENTRY_REPLAY_RATE <= 0
				? import.meta.env.VITE_SENTRY_REPLAY_RATE
				: undefined;
		options = {
			...options,
			replaysSessionSampleRate: rate ?? 0.2,
			replaysOnErrorSampleRate: rate ?? 1,
		};
		if (options.integrations && Array.isArray(options.integrations)) {
			options.integrations.push(new Sentry.Replay());
		} else {
			options.integrations = [new Sentry.Replay()];
		}
	}

	Sentry.init({
		app,
		...options,
	});
}

// The prefix "F" stands for Folderr.

app.component('FNavbar', Navbar);
app.component('FFooter', Footer);
app.component('NavbarAuthenticated', NavbarAuthenticated);
app.component('SuccessesErrors', SuccessNErrors);
app.component('FButton', Button);

// Initalize Modals
app.component('FlexibleModal', FlexibleModal);
app.component('NFlexibleModal', NewFlexible);

app.use(store);
app.use(router);
app.mount('#app');
