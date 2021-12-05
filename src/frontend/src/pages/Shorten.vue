<template>
    <div v-if="loading">
        <div class="bg-bg h-screen flex flex-col ">
            <Navbar />
            <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 flex-grow">
                <h1 class="text-secondary-text text-3xl mb-8">Loading...</h1>
            </div>
        </div>
        <Footer />
    </div>
    <div v-if="username">
        <div class="bg-bg flex-grow flex flex-col min-h-screen">
            <NavbarAuthenticated v-bind:username="username"/>
            <SuccessesErrors ref="sne" />
            <div id="hero" :class="[
                'm-auto',
                'text-center',
                'w-full',
                'mb-10',
            ]">
                <h1 class="text-secondary-text text-3xl mb-8">Shorten a URL</h1>
                <input
                    required
                    type="url"
                    placeholder="Shorten a link!"
                    v-model="link"
                    :class="[
                        'mt-2',
                        'mb-4',
                        'bg-tertiary-bg',
                        'text-text',
                        'p-4',
                        'w-[200px]',
                        'xl:w-2/5',
                        'placeholder-secondary-text',
                        'focus:ring',
                        'focus:outline-none',
                        {
                            'focus:ring-brand': isLinkValid,
                            'focus:ring-secondary-accent': !isLinkValid
                        }
                    ]"
                    @keyup.enter="() => this.isLinkValid ? this.$refs.shorten.click() : false"
                    ref="linkBox"
                >
                <button ref="shorten" v-bind:disabled="!isLinkValid" class="text-brand bg-brand border-brand bg-opacity-5 border-2 p-4 rounded-lg px-6 ml-2" @click="shorten()">Shorten!</button>
                <div v-if="shortenedLink" class="flex justify-center flex-shrink items-center bg-tertiary-bg mx-auto w-min p-2 mb-8 border-2 rounded-lg border-tertiary-bg text-brand">
                    {{shortenedLink}}
                    <button ref="copyButton" v-if="shortenedLink" @click="copy(this.shortenedLink)" class="ml-4 text-brand p-2 px-4 focus:outline-none focus:ring focus:ring-brand rounded-sm">
                        <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="30" height="30" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><g fill="#2ecc71"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></g></svg>
                        <svg v-if="copied" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="30" height="30" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><g fill="#2ecc71"><path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></g></svg>
                    </button>
                    <button @click="() => {this.shortenedLink = ''}" class="bg-none border-none text-brand p-2">X</button>
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
            shortenedLink: '',
            link: '',
            copied: false,
        }
    },
    async created() {
        await this.fetchData();
    },
    computed: {
        isLinkValid() {
            if (!this.link) {
                return false;
            }

            try {
                new URL(this.link);
                return true;
            } catch (_) {
                return false;
            }
        }
    },
    methods: {
        async copy(text) {
            await navigator.clipboard.writeText(text);
            this.copied = true;
            this.$refs.sne.addSuccess("Copied!", 1000)
        },
        async fetchData() {
            if (this.$store.user && this.$store.user.userID) {
                this.username = this.$store.user.username;
                this.loading = false;
                return;
            }
            const output = await api.fetchUser();
            if (output.error) {
                return this.$router.push('/404');
            }
            this.username = output.user.username;
            this.loading = false;
        },
        test(text) {
            alert(text || 'this is a test');
        },
        async shorten() {
            if (!this.isLinkValid) {
                this.$refs.sne.addError("Link is a not a valid url!", 1000);
                return false;
            }

            try {
                const shortened = await api.shortenLink(this.link);

                if (shortened.success) {
                    this.shortenedLink = shortened.output;
                    this.link = '';
                    this.copy(shortened.output);
                    this.$refs.linkBox.blur();
                } else {
                    this.$refs.sne.addError(shortened.error, 5000);
                    console.log(shortened.response);
                }
            } catch (error) {
                if (typeof e === 'string') {
                    this.$refs.sne.addError(error, 5000);
                    return;
                }

                if (error instanceof Error) {
                    console.log(error);
                    this.$refs.sne.addError(error.message, 5000);
                    return;
                }

                this.$refs.sne.addError('Unknown Error Occured while shortening the url', 5000);
                console.log(error);
                console.log(typeof error);
                return;
            }
        }
    }
}
</script>