<template>
    <div v-if="loading">
        <div class="bg-bg h-screen flex flex-col">
            <Navbar />
            <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 flex-grow">
                <h1 class="text-secondary-text text-3xl mb-8">Loading...</h1>
            </div>
        </div>
        <Footer />
    </div>
    <div v-if="oldUsername || oldEmail">
        <div class="bg-bg flex-grow flex flex-col">
            <NavbarAuthenticated v-bind:username="oldUsername"/>
            <FlexibleModal v-bind:hide="modals.deleteAccount" header="Delete Account Confirmation" v-bind:cancel="() => modals.deleteAccount = false" v-bind:cont="confirmDeleteAccount" continueText="Confirm">
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
                <p class="text-secondary-text mt-10">Input a description for your token below</p>
            </FlexibleModal>
            <FlexibleModal
                v-bind:hide="modals.tokens.showDetails"
                header="Token Details"
                v-bind:cont="() => modals.tokens.showDetails = false"
                v-bind:cancel="() => modals.tokens.showDetails = false"
                v-bind:greenContinue="true"
                v-bind:noCancel="true"
            >
                <div class="p-2 text-text bg-yellow-500 mx-auto text-center border-2 border-yellow-500 rounded-lg">
                    You will only see this token once. Store this token somewhere safe. Don't store on a shared PC.
                </div>
                
                <div class="text-text mt-4 text-lg">
                    <p><b>Token:</b></p>
                    <div class="flex flex-shrink">
                        <input
                            readonly
                            title="Your authentication token"
                            v-bind:value='tokenInfo.token'
                            class="mt-2 bg-[#393939] text-text p-4 w-[200px] lg:w-2/5 placeholder-secondary-text"
                            >
                        <button v-on:click="copy(this.tokenInfo.token)" class="ml-4 mt-2 text-brand bg-brand border-brand bg-opacity-5 border-2 p-2 rounded-lg px-4">Copy!</button>
                    </div>
                    <p><br><b>Description:</b> {{tokenInfo.description}}</p>
                </div>

            </FlexibleModal>
            <div v-if="error.length" class="justify-center bg-secondary-accent text-white w-full p-4 text-center flex m-auto">
                <p v-if="error.length">{{error}}</p>
                <button v-on:click="() => {error = ''}" class="bg-none border-none text-black ml-4">X</button>
            </div>
            <div v-if="success.length" class="justify-center bg-brand text-white w-full p-4 text-center flex m-auto">
                <p >{{success}}</p>
                <button v-on:click="() => {success = ''}" class="bg-none border-none text-black ml-4">X</button>
            </div>
            <div class="m-auto text-center pt-10 md:pt-16 w-full h-1/5 flex-grow mb-20">
                <h1 class="text-brand text-3xl mb-10"><b>Account Management</b></h1>
                <div class="md:w-1/2 w-4/6 bg-[#393939] m-auto relative">
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
                        >Username  &#10068;</p>
                        <input
                            required
                            v-model="username" v-bind:placeholder="oldUsername"
                            title="Username must be at least 3 characters long, lowercase, and can include underscores as well as numbers"
                            :class="[
                                'mt-2',
                                'mb-4',
                                'bg-[#393939]',
                                'text-text',
                                'p-4',
                                'w-[200px]',
                                'xl:w-2/5',
                                'placeholder-secondary-text',
                                'focus:ring',
                                'focus:outline-none',
                                {
                                    'focus:ring-brand': /^\w{3,16}$/.test(this.username),
                                    'focus:ring-secondary-accent': !/^\w{3,16}$/.test(this.username)
                                }
                            ]"
                        >
                        <p class="text-secondary-text text-md">Email {{emailerDisabled ? '(Disabled)' : ''}}</p>
                        <input v-model="email" v-bind:disabled="emailerDisabled" v-bind:placeholder="oldEmail" class="mt-2 mb-4 bg-[#393939] text-text p-4 w-[200px] xl:w-2/5 placeholder-secondary-text" :class="[
                            {
                                'opacity-50': emailerDisabled,
                                'hover:cursor-not-allowed': emailerDisabled,
                                'border-secondary-accent': emailerDisabled
                            }
                        ]">
                        <br>
                        <button v-bind:disabled="isInfoSame" v-on:click="updateInfo()" :class="[
                            'mt-2',
                            {
                                'text-brand': !isInfoSame,
                                'text-secondary-text': isInfoSame,
                                'hover:cursor-not-allowed': isInfoSame
                            },
                            'bg-brand',
                            'bg-opacity-5',
                            'border-2',
                            'p-4',
                            'border-brand',
                            'rounded-lg',
                            'px-8'
                        ]">Save changes {{isInfoSame ? '(Disabled)' : ''}}</button>
                        <p class="text-secondary-text text-md mt-10">Current Password</p>
                        <input
                            v-on:keyup.enter="() => this.$refs.newPassword.focus()"
                            v-model="oldPassword"
                            type="password"
                            placeholder="Current Password"
                            :class="[
                                'mt-2',
                                'mb-4',
                                'bg-[#393939]',
                                'text-text',
                                'p-4',
                                'w-[200px]',
                                'xl:w-2/5',
                                'placeholder-secondary-text',
                                'focus:ring',
                                'focus:outline-none',
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
                            New Password  &#10068;
                        </p>
                        <input
                            ref="newPassword"
                            v-on:keyup.enter="() => this.$refs.passwordConfirmation.focus()"
                            v-model="password"
                            type="password"
                            placeholder="New Password"
                            :class="[
                                'mt-2',
                                'mb-4',
                                'bg-[#393939]',
                                'text-text',
                                'p-4',
                                'w-[200px]',
                                'xl:w-2/5',
                                'placeholder-secondary-text',
                                'focus:ring',
                                'focus:outline-none',
                                {
                                    'focus:ring-brand': passwordValid,
                                    'focus:ring-secondary-accent': !passwordValid
                                }
                            ]"
                            title="Passwords must be between 8 and 64 characters, have at least one special character, one lowercase character, and one uppercase character">
                        <p class="text-secondary-text text-md">Confirm Password</p>
                        <input
                            ref="passwordConfirmation"
                            v-on:keyup.enter="() => this.isPasswordValid ? this.$refs.updatePassword.click() : null"
                            v-model="passwordConfirm"
                            type="password"
                            placeholder="Confirm Password"
                            :class="[
                                'mt-2',
                                'mb-4',
                                'bg-[#393939]',
                                'text-text',
                                'p-4',
                                'w-[200px]',
                                'xl:w-2/5',
                                'placeholder-secondary-text',
                                'focus:ring',
                                'focus:outline-none',
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
                                'text-brand': isPasswordValid,
                                'text-secondary-text': !isPasswordValid,
                                'hover:cursor-not-allowed': !isPasswordValid
                            },
                            'bg-brand',
                            'bg-opacity-5',
                            'border-2',
                            'p-4',
                            'border-brand',
                            'rounded-lg',
                            'px-8'
                        ]">Update Password {{!isPasswordValid ? '(Disabled)' : ''}}</button>
                    </div>
                    <div class="mt-10 lg:ml-20">
                        <h2 class="text-text text-2xl"><b>Delete your account</b></h2>
                        <p v-if="owner" class="text-text text-md mt-4"><b>The owner account cannot be deleted.</b></p>
                        <p class="text-secondary-text text-md mt-2">This will remove all of your data from this instance of Folderr, including files and shortened URLs. Files and shortened links will not be deleted instantly.</p>
                        <p class="text-secondary-text text-md mt-4"><b>This cannot be undone and only applies to this instance of Folderr</b></p>
                        <button v-bind:disabled="owner" v-on:click="() => this.modals.deleteAccount = true"
                         :class="[
                            'mt-4',
                            'border-secondary-accent',
                            'bg-secondary-accent',
                            {
                                'text-secondary-text': owner,
                                'text-secondary-accent': !owner,
                                'opacity-80': owner,
                                'hover:cursor-not-allowed': owner
                            },
                            'bg-opacity-5',
                            'border-2',
                            'p-4',
                            'rounded-lg',
                            'px-8'
                        ]">Delete Account {{ owner ? '(Disabled)' : '' }}</button>
                    </div>
                    <div class="lg:ml-20 mt-10">
                        <h2 class="text-text text-2xl"><b>Logout everywhere</b></h2>
                        <p class="text-secondary-text text-md mt-2">This will log you out of every location/device you are logged in at, including the one you’re currently at</p>
                        <button v-on:click="logoutEverywhere()" class="mt-4 text-secondary-accent bg-secondary-accent bg-opacity-5 border-2 p-4 border-secondary-accent rounded-lg px-8">Logout Everywhere</button>
                    </div>
                </div>
                <div class="m-auto pt-10 text-justify w-full md:w-1/2">
                    <hr class="border-brand">
                    <h1 class="text-text text-3xl bold lg:ml-20 pt-10" id="tokens"><b>Token Management</b></h1>
                    <h2 class="mt-5 text-secondary-text text-lg lg:ml-20">Create, view, and delete your API tokens</h2>
                    <div>
                        <h3 v-if="tokens.length === 0" class="lg:ml-20 mt-5 text-secondary-text text-md bold"><b>You have no tokens!</b></h3>
                        <h3 v-else class="lg:ml-20 mt-5 text-secondary-text text-lg bold"><b>Tokens [{{ tokens.length }}/10]</b></h3>
                        <ul class="lg:ml-20 mt-5">
                            <li v-for="token in tokens" v-bind:key="token.createdAt" class="flex mt-5">
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

<script>
import * as api from '../wrappers/api';
export default {
    name: 'Account',
    data() {
        return {
            loading: true,
            username: null,
            oldPassword: null,
            passwordConfirm: null,
            email: null,
            password: null,
            oldUsername: null,
            oldEmail: null,
            owner: null,
            error: '',
            success: '',
            emailerDisabled: false,
            modals: {
                deleteAccount: false,
                tokens: {
                    createToken: false,
                    showDetails: false,
                    deleteAll: false
                }
            },
            tokens: [],
            tokenInfo: {},
            tooltips: {
                password: false
            }
        }
    },
    computed: {
        isInfoSame() {
            let usernameSame = true;
            let emailSame = true;
            const usernameRegex = /^\w{3,16}$/
            if (this.username !== this.oldUsername && usernameRegex.test(usernameRegex)) {
                usernameSame = false;
            }

            if (this.email !== this.oldEmail && this.email?.length >= 4) {
                emailSame = false;
            }

            return usernameSame && emailSame;
        },
        isPasswordValid() {
            let currentInvalid = true;
            let newInvalid = true;
            let match = false;
            const currentLength = this.oldPassword?.length || 0;
            const newLength = this.password?.length || 0;
            if (8 <= currentLength && currentLength <= 64) {
                currentInvalid = false;
            }
            const passwordExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,64}$/;
            if (8 <= newLength && newLength <= 64 && !passwordExp.test(this.password)) {
                newInvalid = false;
            }
            if (this.password === this.passwordConfirm) {
                match = true;
            }

            return !currentInvalid && !newInvalid && match
        },
        passwordValid() {
            const passwordExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,64}$/;
            if (passwordExp.test(this.password)) {
                return true;
            }

            return false;
        },
        oldPasswordValid() {
            const passwordExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,64}$/;
            if (passwordExp.test(this.oldPassword)) {
                return true;
            }
            return false;
        },
        confirmPasswordValid() {
            const passwordExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)[#?!@$%^&*-_[\]].{8,64}$/;
            if (this.passwordConfirm === this.password && passwordExp.test(this.passwordConfirm)) {
                return true;
            }
            return false;
        },
    },
    
    async created() {
        await this.fetchData();
    },
    methods: {
        async copy(text) {
            await navigator.clipboard.writeText(text);
        },
        async fetchData() {
            if (this.$store.user && this.$store.user.userID) {
                this.username = this.$store.user.username;
                this.email = this.$store.user.email;
                this.oldUsername = account.username;
                this.oldEmail = account.email;
                this.loading = false;
                this.owner = this.$store.user.owner
                const tokens = await api.getTokens();
                console.log(tokens);
                if (tokens.error) {
                    this.error = tokens.error instanceof Error ? tokens.error.message : tokens.error;
                } else if (Array.isArray(tokens.message) ) {
                    this.tokens = tokens.message;
                } else {
                    console.log(tokens);
                }
                return;
            }
            const output = await api.fetchUser();
            if (output.error) {
                return this.$router.push('/404');
            }
            const tokens = await api.getTokens();
            if (tokens.error) {
                this.error = tokens.error instanceof Error ? tokens.error.message : tokens.error;
            } else if (Array.isArray(tokens.message) ) {
                this.tokens = tokens.message;
            } else {
                console.log(tokens);
            }
            this.$store.commit('user/setUserinfo', {
                email: output.user.email,
                username: output.user.username,
                userID: output.user.userID,
                createdAt: output.user.createdAt,
                notifications: output.user.notifications,
                owner: output.user.owner,
            });
            this.email = output.user.email;
            this.oldEmail = output.user.email;
            this.username = output.user.username;
            this.oldUsername = output.user.username;
            this.owner = output.user.owner;
            this.loading = false;
        },
        test(text) {
            alert(text || 'this is a test');
        },
        async updateInfo()  {
            this.success = '';
            this.error = '';
            if (this.isInfoSame) {
                this.error = 'You need to update either your email or your username!';
                return;
            }

            const info = {};
            if (this.username !== this.oldUsername) {
                info.username = this.username;
            }

            if (this.email !== this.oldEmail) {
                info.email = this.email;
            }

            try {
                const updated = await api.updateInfo(info);

                if (updated.success) {
                    this.oldEmail = this.email;
                    this.oldUsername = this.username;
                    this.success = 'Information Updated';
                } else {
                    if (updated.error.startsWith('Emailer not configured') ) {
                        this.email = this.oldEmail;
                        this.emailerDisabled = true;
                    }
                    this.error = typeof updated.error === 'string' ? updated.error : updated.error.message;
                }
            } catch (error) {
                if (typeof e === 'string') {
                    this.error = error;
                    return;
                }

                if (error instanceof Error) {
                    console.log(error);
                    this.error = error.message;
                    return;
                }

                this.error = 'Unknown Error Occured while updating your info';
                console.log(error);
                console.log(typeof error);
                return;
            }
        },
        async updatePassword()  {
            this.success = '';
            this.error = '';
            if (!this.isPasswordValid) {
                this.error = 'Password invalid!';
                return;
            }

            try {
                const updated = await api.updatePassword({
                    password: this.oldPassword,
                    newPassword: this.password
                });

                if (updated.success) {
                    this.oldEmail = this.email;
                    this.oldUsername = this.username;
                    this.success = 'Information Updated';
                } else {
                    if (updated.error.startsWith('Emailer not configured') ) {
                        this.email = this.oldEmail;
                        this.emailerDisabled = true;
                    }
                    this.error = typeof updated.error === 'string' ? updated.error : updated.error.message;
                }
            } catch (error) {
                if (typeof e === 'string') {
                    this.error = error;
                    return;
                }

                if (error instanceof Error) {
                    console.log(error);
                    this.error = error.message;
                    return;
                }

                this.error = 'Unknown Error Occured while updating your password';
                console.log(error);
                console.log(typeof error);
                return;
            }
        },
        async logoutEverywhere() {
            this.success = '';
            this.error = '';

            const logout = await api.logoutEverywhere();

            if (logout.success) {
                this.$router.push('/');
                return;
            }

            if (logout.error instanceof Error) {
                this.error = logout.error.message;
                if (import.meta.env.DEV && logout.response) {
                    console.log('Debug Response from API/Logout (everywhere)');
                    console.log(logout.response);
                }
            }

            this.error = logout.error;

            if (import.meta.env.DEV && logout.response) {
                console.log('Debug Response from API/Logout (everywhere)');
                console.log(logout.response);
            }
        },
        async deleteAccount(confirmed) {
            if (!confirmed || this.owner === true) {
                return;
            }

            const deleted = await api.deleteAccount();
            if (deleted.succes) {
                this.$router.push('/deletedaccount');
                return;
            }

            if (!deleted.success) {
                if (deleted.error instanceof Error) {
                    this.error = deleted.error.message;
                    return;
                }

                if (typeof deleted.error === 'string') {
                    this.error = deleted.error;
                    return;
                }
            }
        },
        cancelDeleteAccount() {
            this.modals.deleteAccount = false;
        },
        confirmDeleteAccount() {
            this.modals.deleteAccount = false;
            this.deleteAccount(true);
        },
        tokenCreateModal() {
            this.modals.tokens.createToken = !this.modals.tokens.createToken;
        },
        async createToken(description) {
            this.error = '';
            this.success = '';
            if (!description || typeof description !== 'string') {
                this.error = 'Description needed for the token';
                this.tokenCreateModal();
                return;
            }

            const apitoken = await api.createToken(description);
            if (apitoken.error) {
                this.tokenCreateModal();
                this.error = `Token creation failed. Error: ${apitoken.error instanceof Error ? apitoken.error.message : apitoken.error}`;
                return;
            }

            if (apitoken.success) {
                this.tokenInfo = {
                    token: apitoken.output,
                    description: description
                };
                this.success = 'Token Generated';
                this.tokenCreateModal();
                this.modals.tokens.showDetails = true;
                return;
            }
        },
        async revokeToken(id) {
            this.error = '';
            this.success = '';

            const apitoken = await api.revokeToken(id);
            if (apitoken.error) {
                this.error = `Token revokation failed. Error: ${apitoken.error instanceof Error ? apitoken.error.message : apitoken.error}`;
                return;
            }

            if (apitoken.success) {
                this.success = 'Token Revoked';
                this.tokens = this.tokens.filter((token) => {
                    return token.id !== id
                });
                return;
            }
        }
    }
}
</script>
