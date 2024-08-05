<template>
    <div v-if="loading">
        <div class="bg-bg h-screen flex flex-col">
            <FNavbar />
            <Spinner />
        </div>
        <FFooter />
    </div>
    <div v-if="oldUsername || oldEmail">
        <div ref="top" class="bg-bg grow flex flex-col scroll-smooth">
            <NavbarAuthenticated/>
            <!-- eslint-disable vue/attribute-hyphenation -->
            <NFlexibleModal
                :hide="modals.deleteAccount"
                header="Delete Account Confirmation"
                :cancel="() => modals.deleteAccount = false"
                :cont="confirmDeleteAccount"
                continueText="Confirm"
                :showInput="false"
            >
                <p
                    class="text-secondary-text mt-10"

                ><!-- eslint-disable-next-line max-len-->
                This action will delete your account and all of its associated data <b>from this folderr instance.</b> Your files may take time to be removed from the service.<br></p>
                <template #warning>
                    <div
                        class="
                            flex
                            items-center
                            justify-center
                            p-2
                            px-8
                            text-text
                            font-bold
                            bg-yellow-600
                            text-center
                            border-2
                            border-yellow-600
                            rounded-lg
                            mt-4
                            md:max-w-screen-sm
                            3xl:max-w-full
                            break-words
                            max-w-screen-sm
                            font-info
                        "
                    >
                        <ExclamationIcon
                            class="min-h-6 min-w-6 w-20 h-20 lg:w-10 lg:h-10 text-yellow-300 mr-4"
                            aria-hidden="true"
                        />
                        <b>This action is irreversible. All of your data will be removed.</b>
                    </div>
                </template>
            </NFlexibleModal>

            <NFlexibleModal
                :hide="modals.tokens.createToken"
                header="Input Token Description"
                :cancel="tokenCreateModal"
                :cont="createToken"
                :greenContinue="true"
                :showInput="true"
                placeholder="Something descriptive"
                :needInput="true"
            >
                <p
                    class="text-secondary-text mt-2 font-info"
                >Input a description for your token below</p>
            </NFlexibleModal>
            <FlexibleModal
                :hide="modals.tokens.showDetails"
                header="Token Details"
                :cont="() => modals.tokens.showDetails = false"
                :cancel="() => modals.tokens.showDetails = false"
                :greenContinue="true"
                :noCancel="true"
                :showInput="false"
            >
                <template #warning>
                    <div
                        class="
                            flex
                            items-center
                            justify-center
                            p-2
                            px-8
                            text-text
                            font-bold
                            bg-yellow-600
                            text-center border-2
                            border-yellow-600
                            rounded-lg
                            mt-4
                            md:max-w-screen-sm
                            3xl:max-w-full
                            break-words
                            max-w-screen-sm
                            font-info m-auto
                        ">
                        <ExclamationIcon
                            class="
                                min-h-6
                                min-w-6
                                w-20
                                h-20
                                lg:w-10
                                lg:h-10
                                text-yellow-300
                                justify-center
                                mr-4
                            "
                            aria-hidden="true"/>
                        <!-- eslint-disable-next-line max-len -->
                        You will only see this token once. Store this token somewhere safe. Don't store on a shared PC.
                    </div>
                </template>

                <div class="text-text mt-4 text-lg">
                    <h1 class="font-info"><b>Token</b></h1>
                    <div class="flex flex-shrink bg-tertiary-bg rounded-lg mt-2">
                        <input
                            readonly
                            title="Your API authentication token"
                            :value='tokenInfo.token'
                            class="
                                bg-tertiary-bg
                                p-4
                                placeholder-secondary-text
                                rounded-lg
                                w-full
                                truncate
                                font-input
                                text-secondary-text text-sm
                            "
                        >
                        <button
                            class="text-brand hover:text-brand-darkened mx-4"
                            title="Copy the token"
                            @click="copy(tokenInfo.token)"
                        >
                            <ClipboardCopyIcon
                                v-if="!copied"
                                class="h-5 w-5 hover:text-brand-darkened text-brand"
                                aria-hidden="true"
                            />
                            <ClipboardCheckIcon
                                v-if="copied"
                                class="h-5 w-5 hover:text-brand-darkened text-brand"
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                    <div class="my-4">
                        <h2 class="text-text font-info">Description</h2>
                        <p
                            class="
                                text-sm
                                font-input
                                text-secondary-text
                                max-w-max
                                py-2
                                rounded-lg
                                mt-2
                            ">{{tokenInfo.description}}</p>
                    </div>
                    <div>
                        <h2 class="text-text text-md font-info">ShareX configuration</h2>
                        <div class="bg-secondary-bg rounded-md p-4 truncate font-input text-sm">
                            <code>{<br>
                            &emsp;&emsp;"Version": "14.0.1",<br>
                            <!-- eslint-disable max-len -->
                            &emsp;&emsp;"Name": "{{url.replace(/http(s)?:\/\//, '').replace(/:[0-9]{0,6}/, '')}} Image Host",<br>
                            &emsp;&emsp;"DestinationType": "ImageUploader, TextUploader, FileUploader",<br>
                            <!-- eslint-enable max-len -->
                            &emsp;&emsp;"RequestMethod": "POST",<br>
                            &emsp;&emsp;"RequestURL": "{{url}}/api/file",<br>
                            &emsp;&emsp;"Headers": {<br>
                            &emsp;&emsp;&emsp;&emsp;"authorization": "{{tokenInfo.token}}"<br>
                            &emsp;&emsp;},<br>
                            &emsp;&emsp;"Body": "MultipartFormData",<br>
                            &emsp;&emsp;"FileFormName": "image"<br>
                            }<br>
                            </code>
                            <!-- I must say. That is a rather annoying break of style.-->
                        </div>
                        <!-- eslint-enable vue/attribute-hypenation -->
                        <!-- Client side ability to download or copy the config. -->
                        <div class="flex space-x-2">
                            <button
                                class="
                                    flex
                                    my-2 p-2 px-4
                                    border-0
                                    hover:bg-none
                                    rounded-sm
                                    text-brand-darkened hover:text-brand bg-tertiary-bg"
                                @click="downloadSharexConfig()"
                            >
                                <DocumentDownloadIcon class="w-7 mr-2" aria-hidden="true"/>
                                <b>Download Config!</b>
                            </button>
                            <button
                                class="
                                    flex
                                    my-2 p-2 px-4 border-0
                                    hover:bg-none
                                    rounded-sm
                                    text-brand-darkened hover:text-brand bg-tertiary-bg
                                "
                                @click="copySharexConfig()"
                            >
                                <ClipboardCopyIcon class="w-7 mr-2" aria-hidden="true"/>
                                <b>Copy Config!</b>
                            </button>
                        </div>
                    </div>
                </div>

            </FlexibleModal>
            <SuccessesErrors ref="sne" />
            <div class="m-auto text-center pt-10 md:pt-16 w-full h-1/5 grow mb-20">
                <h1
                    ref="acct"
                    class="text-brand text-3xl mb-10 font-headline"
                ><b>Account Management</b></h1>
                <!--- Mini-Nav -->
                <div class="md:w-1/2 w-4/6 bg-tertiary-bg m-auto sticky top-2 z-10 font-info">
                    <ul class="flex list-none">
                        <li
class="p-5 text-secondary-text" :class="[{
                            'bg-[#303030]': activeSection == 'account'
                        }]">
                            <button @click="scrollToTop()">Account Info</button>
                        </li>
                        <li
class="p-5 text-secondary-text" :class="[{
                            'bg-[#303030]': activeSection == 'privacy'
                        }]">
                            <button
                                @click="privacydiv?.scrollIntoView({ behavior: 'smooth' })"
                            >Privacy</button>
                        </li>
                        <li
class="p-5 text-secondary-text" :class="[{
                            'bg-[#303030]': activeSection == 'tokens'
                        }]">
                            <button
                                @click="tokendiv?.scrollIntoView({ behavior: 'smooth' })"
                            >Token Management</button>
                        </li>
                        <li
v-show="false" class="p-5 text-secondary-text" :class="[{
                            'bg-[#303030]': activeSection == 'integrations'
                        }]">
                            <a href="/account/#integrations">Integrations</a>
                        </li>
                    </ul>
                </div>
                <div class="m-auto pt-10 text-justify w-5/6 md:w-1/2 font-info" >
                    <h1
                        class="text-text text-3xl bold lg:ml-20 font-headline"
                    ><b>Account Info</b></h1>
                    <h2
                        class="mt-5 text-secondary-text text-lg lg:ml-20 font-info"
                    >Update your Folderr username, email, and password</h2>
                    <h3
                        v-if="emailerDisabled"
                        class="mt-2 text-text text-lg lg:ml-20"
                    > <!-- eslint-disable-next-line max-len -->
                        You can't change your email as there is no emailer configured to verify a new email.
                    </h3>
                    <div class="mt-10 lg:ml-20">
                        <!-- eslint-disable max-len -->
                        <label
                            for="username"
                            class="text-secondary-text text-md block"
                            title="Username must be at least 3 characters long, lowercase, and can include underscores as well as numbers"
                        >Username</label>
                        <input
                            id="username"
                            ref="usernameinp"
                            v-model="username"
                            label="Username" required
                            :placeholder="oldUsername"
                            title="Username must be at least 3 characters long, lowercase, and can include underscores as well as numbers"
                            class="
                                block
                                font-input
                                mt-2 mb-2
                                bg-tertiary-bg text-text
                                p-4 w-4/5 xl:w-3/5
                                placeholder-secondary-text
                                focus:ring focus:outline-none
                                rounded-lg max-w-lg"
                            :class="[
                                {
                                    'focus:ring-brand': usernameRegex.test(username),
                                    'focus:ring-secondary-accent': !usernameRegex.test(username)
                                }
                            ]"
                            autocomplete="username"
                        >
                        <!-- eslint-enable max-len -->
                        <div class="bg-[#303030] rounded-lg w-max max-w-lg mb-4">
                            <Disclosure v-slot=" { open }">
                                <DisclosureButton
                                    class="
                                        items-center
                                        px-4 py-2
                                        text-secondary-text hover:text-brand
                                        rounded-lg w-full
                                        text-left flex"
                                    :class="
                                        open ?
                                        'text-brand hover:text-brand-darkened hover:bg-inherit' :
                                        ''"
                                >
                                    <span>Username requirements & allowances</span>
                                    <ChevronDownIcon
                                        class="h-5 ml-2"
                                        :class="open ? 'rotate-180' : ''"
                                        aria-hidden="true"
                                    />
                                </DisclosureButton>
                                <DisclosurePanel class="py-2 px-4 text-secondary-text">
                                    <!-- eslint-disable-next-line max-len -->
                                    Usernames must have at least 3 characters, can be A-z, and can have underscores and numbers.
                                </DisclosurePanel>
                            </Disclosure>
                        </div>
                        <label
                            for="email"
                            class="text-secondary-text text-md block"
                        >Email {{emailerDisabled ? '(Disabled)' : ''}}</label>
                        <input
                            id="email"
                            v-model="email"
                            type="email"
                            label="New email address"
                            :disabled="emailerDisabled"
                            :placeholder="oldEmail"
                            class="
                                caret-brand
                                block
                                font-input
                                mt-2
                                mb-2
                                bg-tertiary-bg
                                border-none
                                text-text
                                p-4
                                w-4/5 xl:w-3/5
                                placeholder-secondary-text
                                focus:valid:ring-brand
                                focus:invalid:ring-secondary-accent-dark
                                focus:ring focus:outline-none
                                rounded-lg max-w-lg"
                            :class="[
                                {
                                    'opacity-50': emailerDisabled,
                                    'hover:cursor-not-allowed': emailerDisabled,
                                }
                            ]"
                            autocomplete="email"
                        >
                        <FButton
                            :button-disabled="isInfoSame"
                            :on-click="updateInfo"
                            buttontitle="Update Your Information"
                            :color-disabled="isInfoSame"
                        >Save Changes</FButton>

                        <label
                            for="password"
                            class="block text-secondary-text text-md mt-10"
                        >Current Password</label>
                        <input
                            id="password"
                            v-model="oldPassword"
                            type="password"
                            label="Current password"
                            placeholder="Current Password"
                            class="
                                caret-brand
                                font-input
                                mt-2
                                mb-2
                                bg-tertiary-bg
                                block
                                border-none
                                text-text
                                p-4
                                w-4/5 xl:w-3/5
                                placeholder-secondary-text
                                focus:ring focus:outline-none
                                rounded-lg max-w-lg"
                            :class="[
                                {
                                    'focus:ring-brand': oldPasswordValid,
                                    'focus:ring-secondary-accent-dark': !oldPasswordValid
                                }
                            ]"
                            autocomplete="current-password"
                            @keyup.enter="() => newPasswordEl?.focus()"
                        >
                        <!-- eslint-disable max-len -->
                        <label
for="newpassword"
                            class="block text-secondary-text text-md"
                            title="Passwords must be between 8 and 256 characters, and must have either a lowercase or uppercase letter, and anything else."
                        >
                            New Password
                        </label>
                        <input
                            id="newpassword"
                            ref="newPassword"
                            v-model="password"
                            label="New password"
                            type="password"
                            placeholder="New Password"
                            class="
                                caret-brand
                                font-input
                                mt-2
                                mb-2
                                block
                                bg-tertiary-bg
                                border-none
                                text-text
                                p-4
                                w-4/5 xl:w-3/5
                                placeholder-secondary-text
                                focus:ring focus:outline-none
                                rounded-lg max-w-lg"
                            :class="[
                                {
                                    'focus:ring-brand': passwordValid,
                                    'focus:ring-secondary-accent': !passwordValid
                                }
                            ]"
                            title="Passwords must be between 8 and 256 characters, and must have either a lowercase or uppercase letter, and anything else."
                            autocomplete="new-password"
                            @keyup.enter="() => passwordConfirmEl?.focus()"
                        >
                        <!-- eslint-enable max-len -->
                        <div class="bg-[#303030] rounded-lg w-max max-w-lg mb-4">
                            <Disclosure v-slot=" { open }">
                                <DisclosureButton
                                    class="
                                        items-center
                                        px-4 py-2
                                        text-secondary-text hover:text-brand text-left
                                        rounded-lg w-full
                                        flex"
                                    :class="
                                        open ?
                                        'text-brand hover:text-brand-darkened hover:bg-inherit' :
                                        ''"
                                >
                                    <span>Password requirements</span>
                                    <ChevronDownIcon
                                        class="h-5 ml-5"
                                        :class="open ? 'rotate-180' : ''"
                                        aria-hidden="true"
                                    />
                                </DisclosureButton>
                                <DisclosurePanel class="py-2 px-4 text-secondary-text">
                                    <!-- eslint-disable-next-line max-len -->
                                    Passwords must be between 8 and 256 characters, and must have either a lowercase or uppercase letter, and anything else.
                                </DisclosurePanel>
                            </Disclosure>
                        </div>
                        <label
                            for="confirmpassword"
                            class="block text-secondary-text text-md"
                        >Confirm Password</label>
                        <input
                            id="confirmpassword"
                            ref="passwordConfirmation"
                            v-model="passwordConfirm"
                            label="Confirm password"
                            type="password"
                            placeholder="Confirm Password"
                            class="
                                caret-brand
                                font-input
                                block
                                mt-2
                                mb-2
                                bg-tertiary-bg
                                border-none
                                text-text
                                p-4
                                w-4/5 xl:w-3/5
                                placeholder-secondary-text
                                focus:ring focus:outline-none
                                rounded-lg max-w-lg"
                            :class="[
                                {
                                    'focus:ring-brand': confirmPasswordValid,
                                    'focus:ring-secondary-accent': !confirmPasswordValid
                                }
                            ]"
                            autocomplete="new-password"
                            @keyup.enter="() => isPasswordValid ? updatePasswordEl?.click() : null"
                        >
                        <FButton
                            :button-disabled="!isPasswordValid"
                            :on-click="updatePassword"
                            buttontitle="Update Your Password"
                            :color-disabled="!isPasswordValid"
                        >Update Password</FButton>
                    </div>
                    <div class="mt-10 lg:ml-20">
                        <h2 class="text-text text-2xl font-headline"><b>Delete your account</b></h2>
                        <p
                            v-if="owner"
                            class="text-text text-md mt-4"
                        ><b>The owner account cannot be deleted.</b></p>
                        <p
                            class="text-secondary-text text-md mt-2"
                        > <!-- eslint-disable-next-line max-len -->
                            This will remove all of your data from this instance of Folderr, including files and shortened URLs. Files and shortened links will not be deleted instantly.
                        </p>
                        <p
                            class="text-secondary-text text-md mt-4"
                        ><b>This cannot be undone and only applies to this instance of Folderr</b>
                        </p>
                        <FButton
                            :buttonDisabled="owner"
                            :on-click="() => modals.deleteAccount = true"
                            buttontitle="Delete Your Account"
                            :colorDisabled="owner"
                            class="mt-2"
                            type="red"
                        >Delete Account</FButton>
                    </div>
                    <div class="lg:ml-20 mt-10">
                        <h2 class="text-text text-2xl"><b>Logout everywhere</b></h2>
                        <p
                            class="text-secondary-text text-md mt-2"
                        > <!-- eslint-disable-next-line max-len -->
                            This will log you out of every location/device you are logged in at, including the one you’re currently at
                        </p>
                        <FButton
                            :on-click="logoutEverywhere"
                            buttontitle="Logout Everywhere"
                            type="red"
                            class="mt-2"
                        >Logout Everywhere</FButton>
                    </div>
                </div>
                <!-- Privacy Management -->
                <div ref="privacydiv" class="m-auto pt-10 text-justify w-5/6 md:w-1/2 font-info">
                    <hr class="border-brand" aria-hidden="true">
                    <h1
                        id="privacy"
                        class="text-text text-3xl bold lg:ml-20 pt-10 font-headline"
                    ><b>Privacy</b>
                    </h1>
                    <h2
                        class="mt-5 text-secondary-text text-lg lg:ml-20"
                    >Manage your privacy settings on this instance
                    </h2>
                    <div class="lg:ml-20">
                        <div class="flex">
                            <input
                                id="dataCollection"
                                v-model="datacollection"
                                class="
                                    block m-4
                                    text-brand border-brand ring-offset-gray-800
                                    focus:ring-brand focus:ring-offset-gray-800
                                    intermediate:ring-offset-gray-800 checked:ring-1
                                    checked:ring-offset-gray-800 bg-tertiary-bg
                                    ring-brand checked:ring-brand
                                    checked:bg-brand rounded-sm
                                "
                                type="checkbox"
                            >
                            <label
                                for="dataCollection"
                                class="block text-secondary-text text-md mt-2.5"
                            >Collect & share data with third-parties
                            </label>
                        </div>
                        <FButton
                            title="Save Privacy Choices"
                            class="block"
                            :on-click="updatePrivacy"
                        >Save Privacy choices
                        </FButton>
                    </div>

                </div>
                <!-- Token Management -->
                <div ref="tokendiv" class="m-auto pt-10 text-justify w-full md:w-1/2">
                    <hr class="border-brand" aria-hidden="true">
                    <h1
                        id="tokens"
                        class="text-text text-3xl bold lg:ml-20 pt-10 font-headline"
                    ><b>Token Management</b>
                    </h1>
                    <h2
                        class="mt-5 text-secondary-text text-lg lg:ml-20"
                    >Create, view, and delete your API tokens
                    </h2>
                    <div>
                        <h3
                            v-if="tokens.length === 0"
                            class="lg:ml-20 mt-5 text-secondary-text text-md bold"
                        ><b>You have no tokens!</b>
                        </h3>
                        <h3
                            v-show="tokens.length > 0"
                            class="lg:ml-20 mt-5 text-secondary-text text-lg bold"
                            ><b>Tokens [{{ tokens.length }}/10]</b>
                        </h3>
                        <ul class="lg:ml-20 mt-5 xl:grid xl:grid-cols-2 xl:gap-1">
                            <li
                                v-for="token in tokens"
                                :key="token.created"
                                class="
                                    max-h-min mt-7
                                    grid gap-4
                                    grid-cols-[repeat(2, minmax(0, 2fr))] grid-flow-col-dense
                                "
                            >
                                <p class="text-secondary-text text-md">
                                    ID: {{ token.id }}


                                <br>Created on: {{ new Date(token.created).toLocaleString() }}
                                <br>Description: {{ token.description }}</p>
                                <button
                                        class="text-secondary-accent border-none w-min m-auto mr-8"
                                        @click="revokeToken(token.id)"
                                    >
                                        <TrashIcon class="h-10" aria-hidden="true"></TrashIcon>
                                </button>
                            </li>
                        </ul>
                        <div class="flex">
                            <FButton
                                class="mt-6 lg:ml-20"
                                @click="tokenCreateModal"
                            >Generate a Token
                            </FButton>
                        </div>
                    </div>
                </div>
            </div>
            <FFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted} from 'vue';
import {
    ExclamationIcon,
    ClipboardCopyIcon,
    ClipboardCheckIcon,
    ChevronDownIcon,
    TrashIcon,
    DocumentDownloadIcon,
} from "@heroicons/vue/solid";
import {Disclosure, DisclosureButton, DisclosurePanel} from "@headlessui/vue";
import {useRouter} from 'vue-router';
import {useUserStore} from '../stores/user';
import {useTokens} from '../stores/tokens';
import * as api from '../wrappers/api';
import {passwordRegex, usernameRegex} from '../utils/regexs'
import SuccessesErrors from "../components/Success-N-Error.vue"; // Success & Error component
import Spinner from "../components/Spinner.vue"
const sne = ref();

const url = computed(() => window.location.origin);

// Router & store
const router = useRouter();
const userStore = useUserStore();
const tokenStore = useTokens();

// Element references

const newPasswordEl = ref<HTMLInputElement>();
const passwordConfirmEl = ref<HTMLInputElement>();
const updatePasswordEl = ref<HTMLButtonElement>();

// User information & loading info
const loading = ref(true);
const username = ref('');
const oldUsername = ref('');
const email = ref('');
const oldEmail = ref('');
const admin = ref(false);

const emailerDisabled = ref(false);

const isInfoSame = computed(() => {
    let usernameSame = true;
    let emailSame = true;
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

// Refs for managing the "active" class of the mini nav
const acct = ref<
    HTMLInputElement
>();
const tokendiv = ref<HTMLDivElement>();
const top = ref<HTMLDivElement>();
const usernameinp = ref<HTMLInputElement>();
const activeSection = ref('account');

const updateInfo = async() => {
    if (isInfoSame.value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('You need to update either your email or your username!');
        return;
    }

    // @ts-expect-error, Can't assign type to empty object, but I will.
    const info: UpdateInfo = {};
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addSuccess('Information Updated!');
            userStore.$patch({
                email: info.email ?? userStore.email,
                username: info.username ?? userStore.username,
            });
        } else {
            if (
                typeof updated.error === 'string' &&
                updated.error.startsWith('Emailer not configured')
            ) {
                email.value = oldEmail.value;
                emailerDisabled.value = true;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(
                typeof updated.error === 'string' ?
                updated.error :
                updated.error.message
            );
        }
    } catch (error) {
        if (typeof error === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(error);
            return;
        }

        if (error instanceof Error) {
            console.log(error);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(error.message);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('Unknown Error Occured while updating your info');
        console.log(error);
        console.log(typeof error);

    }
}

// Password related stuff

const password = ref('');
const passwordConfirm = ref('');
const oldPassword = ref('');

const isPasswordValid = computed(() => {
    let currentInvalid = true;
    let newInvalid = true;
    let match = false;
    const currentLength = oldPassword.value.length || 0;
    const newLength = password.value.length || 0;
    if (currentLength >= 8 && currentLength <= 256) {
        currentInvalid = false;
    }

    if (newLength >= 8 && newLength <= 256 && passwordRegex.test(password.value)) {
        newInvalid = false;
    }

    if (password.value === passwordConfirm.value) {
        match = true;
    }

    return !currentInvalid && !newInvalid && match
})

const passwordValid = computed(() => {
    if (passwordRegex.test(password.value)) {
        return true;
    }

    return false;
})

const oldPasswordValid = computed(() => {
    if (passwordRegex.test(oldPassword.value)) {
        return true;
    }

    return false;
})

const confirmPasswordValid = computed(() => {
    if (passwordConfirm.value === password.value && passwordRegex.test(passwordConfirm.value)) {
        return true;
    }

    return false;
})

const updatePassword = async() =>  {
    if (!isPasswordValid.value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addSuccess('Information Updated!');
        } else {
            if (
                typeof updated.error === 'string' &&
                updated.error.startsWith('Emailer not configured')
            ) {
                email.value = oldEmail.value;
                emailerDisabled.value = true;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(
                typeof updated.error === 'string' ?
                updated.error :
                updated.error.message
            );
        }
    } catch (error) {
        if (typeof error === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(error);
            return;
        }

        if (error instanceof Error) {
            console.log(error);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(error.message);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('Unknown Error Occured while updating your password');
        console.log(error);
        console.log(typeof error);

    }
}

// Privacy Stuff

const datacollection = ref<boolean>();
const privacydiv = ref();

const updatePrivacy = async() => {
    const privacy = await api.updatePrivacy({dataCollection: datacollection.value ?? false});

    if (privacy.success) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addSuccess('Updated your privacy settings');
        userStore.$patch({
            privacy: {
                dataCollection: datacollection.value,
            },
        });
        return;
    }

    if (privacy.error instanceof Error) {
        if (import.meta.env.DEV && privacy.response) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(privacy.error.message);
            console.log('Debug Response from API/Logout (everywhere)');
            console.log(privacy.response);
        }

        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addError(privacy.error);

    if (import.meta.env.DEV && privacy.response) {
        console.log('Debug Response from API/Logout (everywhere)');
        console.log(privacy.response);
    }
}

// Account related stuff
const logoutEverywhere = async() => {
    const logout = await api.logoutEverywhere();

    if (logout.success) {
        userStore.clear();
        return router.push('/');
    }

    if (logout.error instanceof Error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError(logout.error.message);
        if (import.meta.env.DEV && logout.response) {
            console.log('Debug Response from API/Logout (everywhere)');
            console.log(logout.response);
        }

        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addError(logout.error);

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
    if (!confirmed || owner.value) {
        return;
    }

    const deleted = await api.deleteAccount();
    if (deleted.success) {
        userStore.clear();
        return router.push('/account/farewell');
    }

    if (!deleted.success) {
        if (deleted.error instanceof Error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(deleted.error.message);
            return;
        }

        if (typeof deleted.error === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(deleted.error);

        }
    }
}

const cancelDeleteAccount = () => {
    modals.deleteAccount = false;
}

const confirmDeleteAccount = async () => {
    modals.deleteAccount = false;
    return deleteAccount(true);
}

// Token related stuff

const tokens = ref<api.Token[]>([]);

const tokenInfo = reactive<{
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError('Description needed for the token');
        tokenCreateModal();
        return;
    }

    const apitoken = await api.createToken(description);
    if (apitoken.error) {
        tokenCreateModal();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError(
            `Token creation failed. Error: ${
                apitoken.error instanceof Error ?
                apitoken.error.message :
                apitoken.error
            }`
        );
        return;
    }

    if (apitoken.success && apitoken.output) {
        tokenInfo.token = apitoken.output;
        tokenInfo.description = description;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addSuccess('Token Generated');
        await tokenStore.loadTokens();
        if (tokenStore.tokens) {
            tokens.value = tokenStore.tokens
        }

        tokenCreateModal();
        modals.tokens.showDetails = true;

    }
}

const revokeToken = async(id: string) => {
    const apitoken = await api.revokeToken(id);
    if (apitoken.error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addError(
            `Token revokation failed. Error: ${
                apitoken.error instanceof Error ?
                apitoken.error.message :
                apitoken.error
            }`
        );
        return;
    }

    if (apitoken.success) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        sne.value?.addSuccess('Token Revoked');
        tokens.value = tokens.value.filter((token) => token.id !== id);
        tokenStore.setTokens(tokens.value);

    }
}

// Instance methods

const copied = ref(false);

const copy = async(text: string) => {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addSuccess("Copied");
}

const scrollToTop = () => {
    if (top.value) {
        top.value.scrollIntoView({behavior: 'smooth'});
        if (usernameinp.value) {
            usernameinp.value.focus();
        }
    }
}

const downloadSharexConfig = () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const config = JSON.stringify({
       Version: '14.0.1',
       Name: `${url.value.replace(/http(s)?:\/\//, '').replace(/:[0-9]{0,6}/, '')} Image Host`,
       DestinationType: 'ImageUploader, TextUploader, FileUploader',
       RequestMethod: 'POST' ,
       RequestURL: `${url.value}/api/file`,
       Headers: {
        authorization: tokenInfo.token
       },
       Body: 'MultipartFormData',
       FileFormName: 'Image'
    });
    /* eslint-enable @typescript-eslint/naming-convention */
    const bytes = new TextEncoder().encode(config);
    const blob = new Blob([bytes], {
        type: "application/json;charset=utf-8"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${
        url.value.replace(/http(s)?:\/\//, '').replace(/:[0-9]{0,6}/, '')
    } Folderr ShareXConfig.sxcu`;
    link.click();
    URL.revokeObjectURL(link.href);
    document.removeChild(link);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addSuccess('Downloading Config!');
}

const copySharexConfig = async () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const config = JSON.stringify({
       Version: '14.0.1',
       Name: `${url.value.replace(/http(s)?:\/\//, '').replace(/:[0-9]{0,6}/, '')} Image Host`,
       DestinationType: 'ImageUploader, TextUploader, FileUploader',
       RequestMethod: 'POST' ,
       RequestURL: `${url.value}/api/file`,
       Headers: {
        authorization: tokenInfo.token
       },
       Body: 'MultipartFormData',
       FileFormName: 'Image'
    });
    /* eslint-enable @typescript-eslint/naming-convention */
    await navigator.clipboard.writeText(config);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addSuccess('Copied Config!');
}

// Setup the component

onMounted(async() => {
    if (userStore.username && userStore.id && userStore.email) {
        username.value = userStore.username;
        email.value = userStore.email;
        oldUsername.value = userStore.username;
        oldEmail.value = userStore.email;
        loading.value = false;
        owner.value = userStore.owner
        admin.value = userStore.admin;
        datacollection.value = userStore.privacy.dataCollection
        if (tokenStore.tokens) {
            tokens.value = tokenStore.tokens;
        } else {
            await tokenStore.loadTokens();
            if (tokenStore.tokens) {
                tokens.value = tokenStore.tokens;
            } else {
                tokens.value = [];
            }
        }
    } else {
        await userStore.loadUser();
        if (!userStore.email || !userStore.username) {
            return router.push('/404');
        }

        if (tokenStore.tokens) {
            tokens.value = tokenStore.tokens;
        } else {
            await tokenStore.loadTokens();
            if (tokenStore.tokens) {
                tokens.value = tokenStore.tokens;
            } else {
                tokens.value = [];
            }

            email.value = userStore.email;
            oldEmail.value = userStore.email;
            username.value = userStore.username;
            oldUsername.value = userStore.username;
            owner.value = userStore.owner;
            loading.value = false;
            admin.value = userStore.admin;
            datacollection.value = userStore.privacy.dataCollection;
        }
    }

    window.addEventListener('scroll', () => {
        if (tokendiv.value && privacydiv.value) {
            const privacyheight = privacydiv.value.offsetTop - privacydiv.value.offsetHeight - 100;
            if(window.scrollY >= privacyheight) {
                activeSection.value = 'privacy'
            }

            if (window.scrollY >= (tokendiv.value.offsetTop - 200)) {
                activeSection.value = 'tokens';
            }

            if (window.scrollY < privacyheight) {
                activeSection.value = 'account';
            }
        }
    })
})
</script>

<style>
.active {
    background-color: #404040;
}
</style>
