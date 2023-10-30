<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router';
import * as api from '../wrappers/api';
import type SuccessesErrors from './Success-N-Error.vue';
import UInput from './Underline-Input.vue';
import { LoginIcon, CheckCircleIcon } from '@heroicons/vue/solid';

// Initialize refs for the actual logging in.
const username = ref('');
const password = ref('');
const loading = ref(false);
const signups = ref(false);

const props = defineProps<{
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    sne?: InstanceType<typeof SuccessesErrors> & {
        addError: (messaage: string, time?: number) => void,
        addSuccess: (message: string, time?: number) => void
    };
}>();

// Initialize refs
const passw = ref<HTMLInputElement>();
const loginBtn = ref<HTMLButtonElement>();
const router = useRouter();

const login = async() => {
    if (loading.value) { // Can't login if the page is loading!
        return;
    }

    // Ensure the username & password are present.
    if (!username.value || !password.value) {
        const missing = [];
        if (!username.value) {
            missing.push('username');
        }

        if (!password.value) {
            missing.push('password');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        props.sne?.addError(`Error: Missing ${missing.join(' & ')}`);
        return;
    }

    loading.value = true;
    const output = await api.login(username.value, password.value);
    if (output.error) { // Oh no, login failed.
        if (typeof output.error === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            props.sne?.addError(output.error);
        }

        loading.value = false;
        return;
    }

    if (output.success) { // If we logged in, go to the account page.
        return router.push('/account');
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
            <label for="identify" class="block text-text font-info">username or email</label>
            <UInput
                id="identify"
                v-model="username"
                required
                placeholder="your username or email"
                :disabled="loading"
                autocomplete="username"
                :correct="true"
                :bottom-margin="true"
                @keyup.enter="jumpToPassword()"
                />
            <label for="password" class="block text-text font-info justify-center">password</label>
            <UInput
                id="password"
                v-model="password"
                required
                placeholder="your password"
                :disabled="loading"
                autocomplete="current-password"
                type="password"
                :correct="true"
                :bottom-margin="true"
                @keyup.enter="jumpToLogin()"
                />
            <button
                ref="loginBtn"
                class="
                    flex justify-center
                    font-info text-bg-old
                    font-extrabold bg-brand
                    border-2 p-4 border-brand
                    hover:bg-brand-darkened hover:border-brand-darkened
                    rounded-lg w-[100%] xl:w-80
                "
                :class="[{
                    'bg-disabled': loading,
                    'border-disabled': loading,
                    'cursor-wait': loading,
                    'hover:bg-disabled': loading,
                    'hover:border-disabled': loading,
                }]"
                @click="login()"
                ><LoginIcon
                    v-if="!loading"
                    class="my-auto mr-2 w-5"
                /><CheckCircleIcon
                    v-if="loading"
                    class="my-auto mr-2 w-5"
                />{{loading ? 'Logging In' : 'Log In'}}
            </button>
        </div>
</template>