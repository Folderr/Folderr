<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router';
import * as api from '../wrappers/api.js';
import type SuccessesErrors from './Success-N-Error.vue';
import UInput from './Underline-Input.vue';
import Spinner from './Spinner.vue';
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
            <h2 class="text-2xl font-extrabold text-text mb-1 tracking-tight font-headline">Sign In</h2>
            <p class="text-secondary-text text-xs mb-6">Welcome back to your Folderr instance</p>

            <div class="space-y-4">
                <div>
                    <label for="identify" class="block text-xs font-semibold text-secondary-text mb-1.5">Username or Email</label>
                    <UInput
                        id="identify"
                        v-model="username"
                        required
                        placeholder="Enter your username or email"
                        :disabled="loading"
                        autocomplete="username"
                        :correct="true"
                        :bottom-margin="false"
                        @keyup.enter="jumpToPassword()"
                    />
                </div>

                <div>
                    <label for="password" class="block text-xs font-semibold text-secondary-text mb-1.5">Password</label>
                    <UInput
                        id="password"
                        v-model="password"
                        required
                        placeholder="Enter your password"
                        :disabled="loading"
                        autocomplete="current-password"
                        type="password"
                        :correct="true"
                        :bottom-margin="false"
                        @keyup.enter="jumpToLogin()"
                    />
                </div>

                <button
                    ref="loginBtn"
                    type="button"
                    :disabled="loading"
                    class="w-full py-3 px-6 rounded-xl bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-2 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                    @click="login()"
                >
                    <Spinner v-if="loading" class="w-4 h-4 text-bg" />
                    <LoginIcon v-else class="w-4 h-4" />
                    <span>{{ loading ? "Signing In..." : "Sign In" }}</span>
                </button>
            </div>
        </div>
</template>
