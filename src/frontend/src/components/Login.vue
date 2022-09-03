<script setup lang="ts">
import { ref, Ref } from 'vue'
import { useRouter } from 'vue-router';
import * as api from '../wrappers/api';
import SuccessesErrors from '../components/Success-N-Error.vue';
import { EyeIcon, EyeOffIcon } from '@heroicons/vue/solid';

// Initialize refs for the actual logging in.
const username = ref(''), password = ref('');
const loading = ref(false), signups = ref(false);

const props = defineProps<{
    sne?: InstanceType<typeof SuccessesErrors> & {
        addError: (messaage: string, time?: number) => void,
        addSuccess: (message: string, time?: number) => void
    };
}>();

// Initialize refs
const passw = ref<HTMLInputElement>(), loginBtn = ref<HTMLButtonElement>();
const router = useRouter();

const passwordType = ref('password');

const switchPasswordVisibility = () => {
    if (passwordType.value === 'password') {
        passwordType.value = 'text';
    } else {
        passwordType.value = 'password';
    }
}

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
        }
        props.sne?.addError(`Error: Missing ${missing.join(' & ')}`);
        return;
    }

    loading.value = true;
    const output = await api.login(username.value, password.value);
    if (output.error) { // Oh no, login failed.
        if (typeof output.error === 'string') {
            props.sne?.addError(output.error);
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
        <div>
            <h1 class="text-text text-3xl mb-1 font-headline">login</h1>
            <p class="text-secondary-text mb-4 font-headline">welcome back!</p>
            <p class="text-text font-info">username or email</p>
            <input v-on:keyup.enter="jumpToPassword()" v-model="username" placeholder="your username or email" required class="font-input focus:outline-none mb-4 text-brand p-4 pl-0 w-full border-brand border-b-2 placeholder-secondary-text bg-tertiary-bg">
            <br>
            <div class="flex">
                <p class="text-text font-info justify-center">password</p>
            </div>
            <div class="flex mb-1 border-brand border-b-2">
                <input ref="passw" v-on:keyup.enter="jumpToLogin()" v-model="password" placeholder="your password" :type="passwordType" required class="font-input focus:outline-none bg-tertiary-bg text-brand p-4 pl-0 w-full placeholder-secondary-text">
                <button class="pl-2 bg-transparent text-secondary-text hover:text-text border-0" @click="switchPasswordVisibility">
                    <EyeIcon v-if="passwordType === 'text'" class="h-5" />
                    <EyeOffIcon v-if="passwordType === 'password'" class="h-5" />
                </button>
            </div>
            <br>
            <button ref="loginBtn" v-on:click="login()" class="font-info text-white font-extrabold bg-brand-darkened border-2 p-4 border-brand-darkened rounded-lg w-[100%]">Log In</button>
        </div>
</template>