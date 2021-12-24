<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router';
import * as api from '../wrappers/api';
import SuccessesErrors from '../components/Success-N-Error.vue';

// Initialize refs for the actual logging in.
const username = ref(''), password = ref('');
const loading = ref(false), signups = ref(false);

// Initialize ref of custom component, displays errors & successes.
const sne = ref<InstanceType<typeof SuccessesErrors>>();
// Initialize refs
const passw = ref<HTMLInputElement>(), loginBtn = ref<HTMLButtonElement>();
const router = useRouter();

const login = async() => {
    if (loading.value) { // Can't login if the page is loading!
        return;
    }

    // Ensure the username & password are present.
    if (!username.value || !password.value) {
        let missing = [];
        if (!username.value) {
            missing.push('username');
        }
        if (!password.value) {
            missing.push('password');
        } // @ts-expect-error
        sne.value?.addError(`Error: Missing ${missing.join(' & ')}`);
        return;
    }

    loading.value = true;
    const output = await api.login(username.value, password.value);
    if (output.error) { // Oh no, login failed.
        if (typeof output.error === 'string') { // @ts-expect-error
            sne.value?.addError(output.error);
        }

        loading.value = false;
        return;
    }
    if (output.success) { // If we logged in, go to the account page.
        router.push('/account');
    }
}

const jumpToPassword = () => { // Focuses to the password input
    if (password.value.length > 8) {
        loginBtn.value?.click()
    }
    passw.value?.focus();
}

const jumpToLogin = () => { // Focuses on the login button
    loginBtn.value?.click();
}
</script>

<template>
    <div class="bg-bg h-screen flex flex-col">
        <Navbar />
        <SuccessesErrors ref="sne" />
        <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 grow">
            <h1 class="text-secondary-text text-3xl mb-8">Login</h1>
            <p v-if="username.length > 0" class="text-secondary-text mr-28">Username</p>
            <input v-on:keyup.enter="jumpToPassword()" v-model="username" placeholder="Username" required class="focus:outline-none mb-4 bg-bg text-brand p-4 border-brand border-b-2 placeholder-secondary-text">
            <br>
            <p v-if="password.length > 0" class="text-secondary-text mr-28">Password</p>
            <input ref="passw" v-on:keyup.enter="jumpToLogin()" v-model="password" placeholder="Password" type="password" required class="focus:outline-none mb-8 bg-bg text-brand p-4 border-brand border-b-2 placeholder-secondary-text">
            <br>
            <button ref="loginBtn" v-on:click="login()" class="text-brand bg-brand bg-opacity-5 border-2 p-4 border-brand rounded-lg px-16">Login</button>
            <br>
            <p class="text-brand mt-4 underline"><a href="/signup">No account? Make one.</a></p>
        </div>
        <Footer />
    </div>
</template>