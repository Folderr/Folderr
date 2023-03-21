<template>
    <div v-if="loading">
        <div class="bg-bg h-screen flex flex-col ">
            <FNavbar />
            <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 grow">
                <h1 class="text-secondary-text text-3xl mb-8">Loading...</h1>
            </div>
        </div>
        <FFooter />
    </div>
    <div v-if="username">
        <div class="bg-bg grow flex flex-col min-h-screen">
            <NavbarAuthenticated/>
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
                    class="border-0 mt-2 mb-4 bg-tertiary-bg text-text p-4 w-[200px] xl:w-2/5 placeholder-secondary-text focus:ring focus:outline-none rounded-lg max-w-lg"
                    :class="[
                        {
                            'focus:ring-brand': isLinkValid,
                            'focus:ring-secondary-accent': !isLinkValid
                        }
                    ]"
                    @keyup.enter="() => isLinkValid ? shortenBtn?.click() : false"
                    ref="linkBox"
                >
                <FButton
                    v-bind:onClick="shorten"
                    buttontitle="Shorten the Link!"
                    v-bind:buttonDisabled="!isLinkValid"
                    class="p-4 ml-2"
                    v-bind:colorDisabled="!isLinkValid"
                >Shorten It!</FButton>
                <div v-if="shortenedLink" class="flex justify-center flex-shrink items-center bg-tertiary-bg mx-auto w-auto max-w-lg sm:max-w-sm p-2 mb-8 border-2 rounded-lg border-tertiary-bg text-brand">
                    {{shortenedLink}}
                    <button ref="copyButton" v-if="shortenedLink" @click="copy(shortenedLink)" class="ml-4 text-brand p-2 px-4 focus:outline-none focus:ring focus:ring-brand rounded-sm">
                        <ClipboardCopyIcon v-if="!copied" class="h-5 w-5 text-brand-darkened hover:text-brand" aria-hidden="true"/>
                        <ClipboardCheckIcon v-if="copied" class="h-5 w-5 text-brand-darkened hover:text-brand" aria-hidden="true"/>
                    </button>
                    <button @click="() => {shortenedLink = ''}" class="bg-none border-none text-brand p-2">
                        <XIcon class="h-5 w-5 text-brand-darkened hover:text-brand"/>
                    </button>
                </div>
            </div>
            <FFooter />
        </div>
    </div>
</template>

<style>
.active {
    background-color: #282828;
}
</style>
<script setup lang='ts'>
import {onMounted, ref, computed} from 'vue';
import {useUserStore} from '../stores/user';
import {useRouter} from 'vue-router';
import {ClipboardCopyIcon, ClipboardCheckIcon, XIcon} from '@heroicons/vue/solid';
import SuccessesErrors from "../components/Success-N-Error.vue";
import * as api from '../wrappers/api';

// Setup store & router
const store = useUserStore();
const router = useRouter();

// Setup components
const sne = ref<InstanceType<typeof SuccessesErrors> & {
    addError: (messaage: string, time?: number) => void,
    addSuccess: (message: string, time?: number) => void
}>();
const shortenBtn = ref<HTMLButtonElement>();

// Setup loading & user
const loading = ref(true);
const username = ref('');
const admin = ref(false);

// Setup component

onMounted(async() => {
    if (store.username) {
        username.value = store.username;
        loading.value = false;
        admin.value = store.admin;
        return;
    }

    await store.loadUser();
    if (!store.username) {
        return router.push('/404');
    }
    username.value = store.username;
    loading.value = false;
    admin.value = store.admin;
})

const copied = ref(false);

// A small copy function to copy links
const copy = async(text: string): Promise<void> => {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    sne.value?.addSuccess("Copied!", 1000)
}

// Time to shorten those links!
const link = ref('');
const shortenedLink = ref('');
const linkBox = ref<HTMLInputElement>();

const isLinkValid = computed(() => {
    if (!link.value) {
        return false;
    }

    try {
        new URL(link.value);
        return true;
    } catch (_) {
        return false;
    }
})

const shorten = async() =>  {
    if (!isLinkValid.value) {
        sne.value?.addError("Link is a not a valid url!", 1000);
        return false;
    }

    try {
        const shortened = await api.shortenLink(new URL(link.value));

        if (shortened.success && shortened.output) {
            shortenedLink.value = shortened.output;
            link.value = '';
            copy(shortened.output);
            linkBox.value?.blur();
        } else {
            const err = shortened.error instanceof Error ? shortened.error.message : shortened.error || 'Unknown Error'
            sne.value?.addError(err, 5000);
            console.log(shortened.response);
        }
    } catch (error) {
        if (typeof error === 'string') {
            sne.value?.addError(error, 5000);
            return;
        }

        if (error instanceof Error) {
            console.log(error);
            sne.value?.addError(error.message, 5000);
            return;
        }
        sne.value?.addError('Unknown Error Occured while shortening the url', 5000);
        console.log(error);
        console.log(typeof error);
        return;
    }
}

</script>
