import {createApp} from 'vue';
import store from './store';
import router from './router';
import Navbar from './components/Inner-Components/Navbar.vue';
import Footer from './components/Inner-Components/Footer.vue';

import App from './App.vue';

import './index.css';

const app = createApp(App);

app.component('Navbar', Navbar);
app.component('Footer', Footer);

app.use(store);
app.use(router);
app.mount('#app');
