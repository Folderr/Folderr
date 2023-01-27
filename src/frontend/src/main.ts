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
