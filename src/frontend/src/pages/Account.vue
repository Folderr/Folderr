<template>
    <div v-if="loading">
        <div class="bg-bg h-screen flex flex-col">
            <Navbar />
            <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 grow">
                <h1 class="text-secondary-text text-3xl mb-8">Loading...</h1>
            </div>
        </div>
        <Footer />
    </div>
    <div v-if="oldUsername || oldEmail">
        <div class="bg-bg grow flex flex-col">
            <NavbarAuthenticated v-bind:username="oldUsername"/>
            <FlexibleModal v-bind:hide="modals.deleteAccount" header="Delete Account Confirmation" v-bind:cancel="() => modals.deleteAccount = false" v-bind:cont="confirmDeleteAccount" continueText="Confirm" v-bind:showInput="false">
                <p class="text-secondary-text mt-10">This action will delete your account and all of its associated data <b>from this folderr instance.</b> Your files may take time to be removed from the service.<br><b>This action is irreversible</b></p>
            </FlexibleModal>
            <FlexibleModal
                v-bind:hide="modals.tokens.createToken"
                header="Input Token Description"
                v-bind:cancel="tokenCreateModal"
                v-bind:cont="createToken"
                v-bind:greenContinue="true"
                v-bind:showInput="true"
                placeholder="Something descriptive"
                v-bind:needInput="true"
            >
                <p class="text-secondary-text mt-2">Input a description for your token below</p>
            </FlexibleModal>
            <FlexibleModal
                v-bind:hide="modals.tokens.showDetails"
                header="Token Details"
                v-bind:cont="() => modals.tokens.showDetails = false"
                v-bind:cancel="() => modals.tokens.showDetails = false"
                v-bind:greenContinue="true"
                v-bind:noCancel="true"
                v-bind:showInput="false"
            >
                <div class="flex items-center p-2 px-8 text-text bg-yellow-500 mx-auto text-center border-2 border-yellow-500 rounded-lg mt-4 lg:w-max max-w-max w-4/5">
                    <ExclamationIcon class="min-h-6 min-w-6 w-20 h-20 lg:w-10 lg:h-10 text-yellow-300 justify-center mr-4" aria-hidden="true"/>
                    You will only see this token once. Store this token somewhere safe. Don't store on a shared PC.
                </div>
                
                <div class="text-text mt-4 text-lg">
                    <p><b>Token:</b></p>
                    <div class="flex flex-shrink bg-tertiary-bg rounded-lg mt-4 w-max">
                        <input
                            readonly
                            title="Your API authentication token"
                            v-bind:value='tokenInfo.token'
                            class="bg-tertiary-bg text-text p-4 placeholder-secondary-text rounded-lg"
                            >
                        <button
                            v-on:click="copy(tokenInfo.token)"
                            class="text-brand mx-4"
                            title="Copy the token"
                        >
                            <ClipboardCopyIcon v-if="!copied" class="h-5 w-5 text-brand-darkened hover:text-brand" aria-hidden="true"/>
                            <ClipboardCheckIcon v-if="copied" class="h-5 w-5 text-brand-darkened hover:text-brand" aria-hidden="true"/>
                        </button>
                    </div>
                    <p><br><b>Description:</b></p>
                    <p class="bg-tertiary-bg w-max px-4 py-4 rounded-lg mt-4">{{tokenInfo.description}}</p>
                </div>

            </FlexibleModal>
            <SuccessesErrors ref="sne" />
            <div class="m-auto text-center pt-10 md:pt-16 w-full h-1/5 grow mb-20">
                <h1 class="text-brand text-3xl mb-10"><b>Account Management</b></h1>
                <div class="md:w-1/2 w-4/6 bg-tertiary-bg m-auto relative">
                    <ul class="flex list-none">
                        <li class="active p-5 text-secondary-text">
                            <a href="/account">Account Info</a>
                        </li>
                        <li class="p-5 text-secondary-text">
                            <a href="/account/#tokens">Token Management</a>
                        </li>
                        <li v-show="false" class="p-5 text-secondary-text">
                            <a href="/account/#integrations">Integrations</a>
                        </li>
                    </ul>
                </div>
                <div class="m-auto pt-10 text-justify w-5/6 md:w-1/2">
                    <h1 class="text-text text-3xl bold lg:ml-20"><b>Account Info</b></h1>
                    <h2 class="mt-5 text-secondary-text text-lg lg:ml-20">Update your Folderr username, email, and password</h2>
                    <h3 class="mt-2 text-text text-lg lg:ml-20" v-if="emailerDisabled">You can't change your email as there is no emailer configured to verify a new email.</h3>
                    <div class="mt-10 lg:ml-20">
                        <p
                            class="text-secondary-text text-md"
                            title="Username must be at least 3 characters long, lowercase, and can include underscores as well as numbers"
                        >Username</p>
                        <input
                            label="New username"
                            required
                            v-model="username" v-bind:placeholder="oldUsername"
                            title="Username must be at least 3 characters long, lowercase, and can include underscores as well as numbers"
                            class="mt-2 mb-2 bg-tertiary-bg text-text p-4 w-4/5 xl:w-3/5 placeholder-secondary-text focus:ring focus:outline-none rounded-lg max-w-lg"
                            :class="[
                                {
                                    'focus:ring-brand': /^\w{3,16}$/.test(username),
                                    'focus:ring-secondary-accent': !/^\w{3,16}$/.test(username)
                                }
                            ]"
                        >
                        <div class="bg-secondary-bg rounded-lg w-max max-w-lg mb-4">
                            <Disclosure v-slot=" { open }">
                                <DisclosureButton
                                    class="items-center px-4 py-2 text-secondary-text hover:text-brand rounded-lg hover:bg-secondary-bg w-full text-left flex"
                                    :class="open ? 'bg-brand text-secondary-bg' : ''"
                                >
                                    <span>Username requirements & allowances</span>
                                    <ChevronDownIcon
                                        class="h-5 ml-5"
                                        :class="open ? 'rotate-180' : ''"
                                        aria-hidden="true"
                                    />
                                </DisclosureButton>
                                <DisclosurePanel class="py-2 px-4 text-secondary-text">
                                    Usernames must have at least 3 characters, can be A-z, and can have underscores and numbers.
                                </DisclosurePanel>
                            </Disclosure>
                        </div>
                        <p class="text-secondary-text text-md">Email {{emailerDisabled ? '(Disabled)' : ''}}</p>
                        <input
                            type="email"
                            label="New email address"
                            v-model="email"
                            v-bind:disabled="emailerDisabled"
                            v-bind:placeholder="oldEmail"
                            class="mt-2 mb-4 bg-tertiary-bg text-text p-4 w-4/5 xl:w-3/5 placeholder-secondary-text focus:ring focus:outline-none rounded-lg max-w-lg caret-brand"
                            :class="[
                                {
                                    'opacity-50': emailerDisabled,
                                    'hover:cursor-not-allowed': emailerDisabled,
                                    'border-secondary-accent': emailerDisabled
                                }
                            ]"
                        >
                        <br>
                        <button v-bind:disabled="isInfoSame" v-on:click="updateInfo()" :class="[
                            'mt-2',
                            {
                                'text-brand': !isInfoSame,
                                'text-brand-darkened': isInfoSame,
                                'hover:cursor-not-allowed': isInfoSame,
                                'bg-brand-darkened': isInfoSame,
                                'border-brand-darkened': isInfoSame,
                                'border-brand': !isInfoSame,
                                'bg-brand': !isInfoSame
                            },
                            'bg-opacity-5',
                            'border-2',
                            'p-4',
                            'rounded-lg',
                            'px-8'
                        ]">Save Changes</button>
                        <p class="text-secondary-text text-md mt-10">Current Password</p>
                        <input
                            v-on:keyup.enter="() => newPasswordEl?.focus()"
                            v-model="oldPassword"
                            type="password"
                            label="Current password"
                            placeholder="Current Password"
                            class="mt-2 mb-4 bg-tertiary-bg text-text p-4 w-4/5 xl:w-3/5 placeholder-secondary-text focus:ring focus:outline-none rounded-lg max-w-lg"
                            :class="[
                                {
                                    'focus:ring-brand': oldPasswordValid,
                                    'focus:ring-secondary-accent': !oldPasswordValid
                                }
                            ]"
                        >
                        <p
                            class="text-secondary-text text-md"
                            title="Passwords must be between 8 and 64 characters, have at least one special character, one lowercase character, and one uppercase character"
                        >
                            New Password
                        </p>
                        <input
                            ref="newPassword"
                            label="New password"
                            v-on:keyup.enter="() => passwordConfirmEl?.focus()"
                            v-model="password"
                            type="password"
                            placeholder="New Password"
                            class="mt-2 mb-2 bg-tertiary-bg text-text p-4 w-4/5 xl:w-3/5 placeholder-secondary-text focus:ring focus:outline-none rounded-lg max-w-lg"
                            :class="[
                                {
                                    'focus:ring-brand': passwordValid,
                                    'focus:ring-secondary-accent': !passwordValid
                                }
                            ]"
                            title="Passwords must be between 8 and 64 characters, have at least one special character, one lowercase character, and one uppercase character"
                        >
                        <div class="bg-secondary-bg rounded-lg w-max max-w-lg mb-4">
                            <Disclosure v-slot=" { open }">
                                <DisclosureButton
                                    class="items-center px-4 py-2 text-secondary-text hover:text-brand rounded-lg hover:bg-secondary-bg w-full text-left flex"
                                    :class="open ? 'bg-brand text-secondary-bg' : ''"
                                >
                                    <span>Password requirements</span>
                                    <ChevronDownIcon
                                        class="h-5 ml-5"
                                        :class="open ? 'rotate-180' : ''"
                                        aria-hidden="true"
                                    />
                                </DisclosureButton>
                                <DisclosurePanel class="py-2 px-4 text-secondary-text">
                                    Passwords need to be between 8 and 64 characters. They must have one special character, one lowercase character, and one uppercase character.
                                    <br>
                                    Folderr allows numbers to be used in passwords.
                                </DisclosurePanel>
                            </Disclosure>
                        </div>
                        <p class="text-secondary-text text-md">Confirm Password</p>
                        <input
                            label="Confirm password"
                            ref="passwordConfirmation"
                            v-on:keyup.enter="() => isPasswordValid ? updatePasswordEl?.click() : null"
                            v-model="passwordConfirm"
                            type="password"
                            placeholder="Confirm Password"
                            class="mt-2 mb-4 bg-tertiary-bg text-text p-4 w-4/5 xl:w-3/5 placeholder-secondary-text focus:ring focus:outline-none rounded-lg max-w-lg"
                            :class="[
                                {
                                    'focus:ring-brand': confirmPasswordValid,
                                    'focus:ring-secondary-accent': !confirmPasswordValid
                                }
                            ]"
                        >
                        <br>
                        <button ref="updatePasswword" v-bind:disabled="!isPasswordValid" v-on:click="updatePassword()"
                        title="Update your password" :class="[
                            'mt-2',
                            {
                                'text-brand': !isInfoSame,
                                'text-brand-darkened': isInfoSame,
                                'hover:cursor-not-allowed': isInfoSame,
                                'bg-brand-darkened': isInfoSame,
                                'border-brand-darkened': isInfoSame,
                                'border-brand': !isInfoSame,
                                'bg-brand': !isInfoSame
                            },
                            'bg-opacity-5',
                            'border-2',
                            'p-4',
                            'rounded-lg',
                            'px-8'
                        ]">Update Password</button>
                    </div>
                    <div class="mt-10 lg:ml-20">
                        <h2 class="text-text text-2xl"><b>Delete your account</b></h2>
                        <p v-if="owner" class="text-text text-md mt-4"><b>The owner account cannot be deleted.</b></p>
                        <p class="text-secondary-text text-md mt-2">This will remove all of your data from this instance of Folderr, including files and shortened URLs. Files and shortened links will not be deleted instantly.</p>
                        <p class="text-secondary-text text-md mt-4"><b>This cannot be undone and only applies to this instance of Folderr</b></p>
                        <button v-bind:disabled="owner" v-on:click="() => modals.deleteAccount = true"
                         :class="[
                            'mt-4',,
                            {
                                'text-secondary-accent-dark': owner,
                                'bg-secondary-accent-dark': owner,
                                'border-secondary-accent-dark': owner,
                                'text-secondary-accent': !owner,
                                'border-secondary-accent': !owner,
                                'bg-secondary-accent': !owner,
                                'opacity-80': owner,
                                'hover:cursor-not-allowed': owner
                            },
                            'bg-opacity-5',
                            'border-2',
                            'p-4',
                            'rounded-lg',
                            'px-8'
                        ]">Delete Account</button>
                    </div>
                    <div class="lg:ml-20 mt-10">
                        <h2 class="text-text text-2xl"><b>Logout everywhere</b></h2>
                        <p class="text-secondary-text text-md mt-2">This will log you out of every location/device you are logged in at, including the one you’re currently at</p>
                        <button v-on:click="logoutEverywhere()" class="mt-4 text-secondary-accent bg-secondary-accent bg-opacity-5 border-2 p-4 border-secondary-accent rounded-lg px-8">Logout Everywhere</button>
                    </div>
                </div>
                <div class="m-auto pt-10 text-justify w-full md:w-1/2">
                    <hr class="border-brand" aria-hidden="true">
                    <h1 class="text-text text-3xl bold lg:ml-20 pt-10" id="tokens"><b>Token Management</b></h1>
                    <h2 class="mt-5 text-secondary-text text-lg lg:ml-20">Create, view, and delete your API tokens</h2>
                    <div>
                        <h3 v-if="tokens.length === 0" class="lg:ml-20 mt-5 text-secondary-text text-md bold"><b>You have no tokens!</b></h3>
                        <h3 v-show="tokens.length > 0" class="lg:ml-20 mt-5 text-secondary-text text-lg bold"><b>Tokens [{{ tokens.length }}/10]</b></h3>
                        <ul class="lg:ml-20 mt-5">
                            <li v-for="token in tokens" v-bind:key="token.created" class="flex mt-5">
                                <p class="text-secondary-text text-md">ID: {{ token.id }}<br>Created on: {{ new Date(token.created).toLocaleString() }}<br>Description: {{ token.description }}</p>
                                <button
                                    v-on:click="revokeToken(token.id)"
                                    class="ml-4 border-secondary-accent text-secondary-accent bg-secondary-accent bg-opacity-5 border-2 p-2 rounded-lg px-4"
                                >Revoke</button>
                            </li>
                        </ul>
                        <div class="flex">
                            <button v-on:click="tokenCreateModal()" class="mt-4 lg:ml-20 text-brand bg-brand border-brand bg-opacity-5 border-2 p-2 rounded-lg px-4">Generate a Token</button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    </div>
</template>

<style>
.active {
    background-color: #282828;
}
</style>

<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue';
import {ExclamationIcon, ClipboardCopyIcon, ClipboardCheckIcon, QuestionMarkCircleIcon, ChevronDownIcon} from "@heroicons/vue/solid";
import {Disclosure, DisclosureButton, DisclosurePanel} from "@headlessui/vue";
import {useRouter} from 'vue-router';
import { useStore } from 'vuex';
import * as api from '../wrappers/api';
import SuccessesErrors from "../components/Success-N-Error.vue"; // Success & Error component
const sne = ref<InstanceType<typeof SuccessesErrors> & {
    addError: (messaage: string, time?: number) => void,
    addSuccess: (message: string, time?: number) => void
}>();

// Router & store
const router = useRouter();
const store = useStore();

// Element references

const newPasswordEl = ref<HTMLInputElement>();
const passwordConfirmEl = ref<HTMLInputElement>();
const updatePasswordEl = ref<HTMLButtonElement>();

// User information & loading info
const loading = ref(true);
const username = ref(''), oldUsername = ref('');
const email = ref(''), oldEmail = ref('');

const emailerDisabled = ref(false);

const isInfoSame = computed(() => {
    let usernameSame = true;
    let emailSame = true;
    const usernameRegex = /^\w{3,16}$/
    if (username.value !== oldUsername.value && usernameRegex.test(username.value)) {
        usernameSame = false;
    }

    if (email.value !== oldEmail.value && email.value.length >= 4) {
        emailSame = false;
    }

    return usernameSame && emailSame;
})

type UpdateInfo = {
    email: string;
    username?: string;
} | {
    username: string;
    email?: string;
} | {
    username: string;
    email: string;
}

const updateInfo = async() => {
    if (isInfoSame.value) {
        sne.value?.addError('You need to update either your email or your username!');
        return;
    }

    // @ts-expect-error
    const info: UpdateInfo = {}; // Hush TS, I know what the fuck im doing.
    if (username.value !== oldUsername.value) {
        info.username = username.value;
    }

    if (email.value !== oldEmail.value) {
        info.email = email.value;
    }

    try {
        const updated = await api.updateInfo(info);

        if (updated.success) {
            oldEmail.value = email.value;
            oldUsername.value = username.value;
            sne.value?.addError('Information Updated!');
        } else {
            if (typeof updated.error === 'string' && updated.error.startsWith('Emailer not configured') ) {
                email.value = oldEmail.value;
                emailerDisabled.value = true;
            }
            sne.value?.addError(typeof updated.error === 'string' ? updated.error : updated.error.message);
        }
    } catch (error) {
        if (typeof error === 'string') {
            sne.value?.addError(error);
            return;
        }

        if (error instanceof Error) {
            console.log(error);
            sne.value?.addError(error.message);
            return;
        }

        sne.value?.addError('Unknown Error Occured while updating your info');
        console.log(error);
        console.log(typeof error);
        return;
    }
}

// Password related stuff
const password = ref(''), passwordConfirm = ref(''), oldPassword = ref('');

const isPasswordValid = computed(() => {
    let currentInvalid = true;
    let newInvalid = true;
    let match = false;
    const currentLength = oldPassword.value.length || 0;
    const newLength = password.value.length || 0;
    if (8 <= currentLength && currentLength <= 64) {
        currentInvalid = false;
    }
    const passwordExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,64}$/;
    if (8 <= newLength && newLength <= 64 && !passwordExp.test(password.value)) {
        newInvalid = false;
    }
    if (password.value === passwordConfirm.value) {
        match = true;
    }

    return !currentInvalid && !newInvalid && match
})

const passwordValid = computed(() => {
    const passwordExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,64}$/;
    if (passwordExp.test(password.value)) {
        return true;
    }

    return false;
})

const oldPasswordValid = computed(() => {
    const passwordExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,64}$/;
    if (passwordExp.test(oldPassword.value)) {
        return true;
    }
    
    return false;
})

const confirmPasswordValid = computed(() => {
    const passwordExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,64}$/;
    if (passwordConfirm.value === password.value && passwordExp.test(passwordConfirm.value)) {
        return true;
    }
    
    return false;
})

const updatePassword = async() =>  {
    if (!isPasswordValid.value) {
        sne.value?.addError('Password invalid!');
        return;
    }

    try {
        const updated = await api.updatePassword({
            password: oldPassword.value,
            newPassword: password.value
        });

        if (updated.success) {
            oldPassword.value = password.value;
            password.value = '';
            sne.value?.addError('Information Updated!');
        } else {
            if (typeof updated.error === 'string' && updated.error.startsWith('Emailer not configured') ) {
                email.value = oldEmail.value;
                emailerDisabled.value = true;
            }
            sne.value?.addError(typeof updated.error === 'string' ? updated.error : updated.error.message);
        }
    } catch (error) {
        if (typeof error === 'string') {
            sne.value?.addError(error);
            return;
        }

        if (error instanceof Error) {
            console.log(error);
            sne.value?.addError(error.message);
            return;
        }

        sne.value?.addError('Unknown Error Occured while updating your password');
        console.log(error);
        console.log(typeof error);
        return;
    }
}

// Account related stuff
const logoutEverywhere = async() => {
    const logout = await api.logoutEverywhere();

    if (logout.success) {
        router.push('/');
        return;
    }

    if (logout.error instanceof Error) {
        sne.value?.addError(logout.error.message);
        if (import.meta.env.DEV && logout.response) {
            console.log('Debug Response from API/Logout (everywhere)');
            console.log(logout.response);
        }
    }

    sne.value?.addError(logout.error instanceof Error ? logout.error.message : logout.error);

    if (import.meta.env.DEV && logout.response) {
        console.log('Debug Response from API/Logout (everywhere)');
        console.log(logout.response);
    }
}

const owner = ref(false);
// Init modals
const modals = reactive({
    deleteAccount: false,
    tokens: {
        createToken: false,
        showDetails: false
    }
});

const deleteAccount = async(confirmed: boolean) => {
    if (!confirmed || owner.value === true) {
        return;
    }

    const deleted = await api.deleteAccount();
    if (deleted.success) {
        router.push('/farewell');
        return;
    }

    if (!deleted.success) {
        if (deleted.error instanceof Error) {
            sne.value?.addError(deleted.error.message);
            return;
        }

        if (typeof deleted.error === 'string') {
            sne.value?.addError(deleted.error);
            return;
        }
    }
}

const cancelDeleteAccount = () => {
    modals.deleteAccount = false;
}

const confirmDeleteAccount = () => {
    modals.deleteAccount = false;
    return deleteAccount(true);
}

// Token related stuff

const tokens = ref<api.Token[]>([]);

let tokenInfo = reactive<{
    token: string;
    description: string;
}>({
    description: '',
    token: ''
});
const tokenCreateModal = () => {
    modals.tokens.createToken = !modals.tokens.createToken;
}

const createToken = async(description: string) => {
    if (!description || typeof description !== 'string') {
        sne.value?.addError('Description needed for the token');
        tokenCreateModal();
        return;
    }

    const apitoken = await api.createToken(description);
    if (apitoken.error) {
        tokenCreateModal();
        sne.value?.addError(`Token creation failed. Error: ${apitoken.error instanceof Error ? apitoken.error.message : apitoken.error}`);
        return;
    }

    if (apitoken.success && apitoken.output) {
        tokenInfo.token = apitoken.output;
        tokenInfo.description = description;
        sne.value?.addSuccess('Token Generated');
        const tokenRes = await api.getTokens();
        if (tokenRes && tokenRes.message) {
            tokens.value = tokenRes.message;
        }
        tokenCreateModal();
        console.log(tokenInfo);
        modals.tokens.showDetails = true;
        return;
    }
}

const revokeToken = async(id: string) => {
    const apitoken = await api.revokeToken(id);
    if (apitoken.error) {
        sne.value?.addError(`Token revokation failed. Error: ${apitoken.error instanceof Error ? apitoken.error.message : apitoken.error}`);
        return;
    }

    if (apitoken.success) {
        sne.value?.addSuccess('Token Revoked');
        tokens.value = tokens.value.filter((token) => {
            return token.id !== id
        });
        return;
    }
}

// Instance methods

const copied = ref(false);

const copy = async(text: string) => {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    sne.value?.addSuccess("Copied");
}

// Setup the component

onMounted(async() => {
    if (store.state.user && store.state.user.userID) {
        username.value = store.state.user.username;
        email.value = store.state.user.email;
        oldUsername.value = store.state.user.username;
        oldEmail.value = store.state.user.email;
        loading.value = false;
        owner.value = store.state.user.owner
        const tokenRes = await api.getTokens();
        if (tokenRes.error) {
            sne.value?.addError(tokenRes.error instanceof Error ? tokenRes.error.message : tokenRes.error);
        } else if (Array.isArray(tokenRes.message) ) {
            tokens.value = tokenRes.message;
        } else {
            console.log(tokens);
        }
    } else {
        const output = await api.fetchUser();
        if (output.error || !output.user) {
            router.push('/404');
        } else {
            const tokenRes = await api.getTokens();
            if (tokenRes.error) {
                sne.value?.addError(tokenRes.error instanceof Error ? tokenRes.error.message : tokenRes.error);
            } else if (Array.isArray(tokenRes.message) ) {
                tokens.value = tokenRes.message;
            } else {
                console.log(tokenRes);
            }
            store.commit('user/setUserinfo', {
                email: output.user.email,
                username: output.user.username,
                userID: output.user.id,
                createdAt: output.user.createdAt,
                notifications: output.user.notifications,
                owner: output.user.owner,
            });
            email.value = output.user.email;
            oldEmail.value = output.user.email;
            username.value = output.user.username;
            oldUsername.value = output.user.username;
            owner.value = output.user.owner;
            loading.value = false;
        }
    }
})
</script>
