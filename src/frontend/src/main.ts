import {createApp} from 'vue';
import store from './store';
import router from './router';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';
import NavbarAuthenticated from './components/Navbar-Authenticated.vue';
import SuccessNErrors from './components/Success-N-Error.vue';

// Modals

import FlexibleModal from './components/Modals/Flexible.vue';

import App from './App.vue';

import './index.css';

const app = createApp(App);

app.component('Navbar', Navbar);
app.component('Footer', Footer);
app.component('NavbarAuthenticated', NavbarAuthenticated);
app.component('SuccessesErrors', SuccessNErrors);

// Initalize Modals
app.component('FlexibleModal', FlexibleModal);

app.use(store);
app.use(router);
app.mount('#app');
