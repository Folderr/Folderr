<template>
    <div v-if="loading">
        <div class="bg-bg h-screen flex flex-col ">
            <Navbar />
            <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 grow">
                <h1 class="text-secondary-text text-3xl mb-8">Loading...</h1>
            </div>
        </div>
        <Footer />
    </div>
    <div v-if="username">
        <div class="bg-bg grow flex flex-col min-h-screen">
            <NavbarAuthenticated v-bind:username="username" :admin="admin"/>
            <SuccessesErrors ref="sne" />
            <div id="hero" :class="[
                'm-auto',
                'text-center',
                'w-full',
                'mb-10',
                {
                    'mt-10': canPreview
                }
            ]">
                <h1 class="text-secondary-text text-3xl mb-8">Upload a File</h1>
                <h1 v-if="file" class="text-brand text-xl mb-8">File: {{ file.name }}</h1>
                <div v-if="canPreview" class="p-1 bg-brand rounded-lg border-2 border-tertiary-bg m-auto mb-8 text-center max-w-xl w-max">
                    <img v-if="file?.type.startsWith('image')" class="m-auto" v-bind:src="filePreview">
                    <video v-bind:src="filePreview" controls v-if="file?.type.startsWith('video')" class="m-auto">
                        <source v-bind:src="filePreview" v-bind:type="file?.type">
                        Your browser can't play this video :(
                        <br>No preview for you
                    </video>
                </div>
                <input
                    ref="fileInput"
                    type="file"
                    @input="pickFile"
                    hidden="true"
                    label="File upload input box, hidden from view"
                >
                <div v-if="link" class="flex justify-center flex-shrink items-center bg-tertiary-bg mx-auto w-min p-2 mb-8 border-2 rounded-lg border-tertiary-bg text-brand">
                    {{link}}
                    <button v-if="link" @click="copy(link)" class="ml-4 text-brand p-2 px-4">
                        <ClipboardCopyIcon v-if="!copied" class="h-5 w-5 text-brand-darkened hover:text-brand" aria-hidden="true"/>
                        <ClipboardCheckIcon v-if="copied" class="h-5 w-5 text-brand-darkened hover:text-brand" aria-hidden="true"/>
                    </button>
                    <button v-if="link" @click="link = ''" class="text-brand pr-4">
                        <XIcon class="text-brand hover:text-brand h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                <div class="flex justify-center">
                    <button v-on:click="startSelection" class="text-brand bg-brand border-brand bg-opacity-5 border-2 p-2 rounded-lg px-4">Pick a File</button>
                    <button v-if="file" v-on:click="upload" class="ml-4 text-brand bg-brand border-brand bg-opacity-5 border-2 p-2 rounded-lg px-4">Upload file!</button>
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
import {ref, onMounted, computed} from 'vue';
import {useStore} from 'vuex';
import {useRouter} from 'vue-router';
import {ClipboardCopyIcon, ClipboardCheckIcon, XIcon} from '@heroicons/vue/solid';
import * as api from '../wrappers/api';
import SuccessesErrors from "../components/Success-N-Error.vue";

// Setup store & router
const store = useStore();
const router = useRouter();

// Setup components
const sne = ref<InstanceType<typeof SuccessesErrors> & {
    addError: (messaage: string, time?: number) => void,
    addSuccess: (message: string, time?: number) => void
}>();

// Setup loading & user
const loading = ref(true);
const username = ref('');
const admin = ref(false);

// Setup component

onMounted(async() => {
    if (store.state.user && store.state.user.userID) {
        username.value = store.state.user.username;
        loading.value = false;
        admin.value = store.state.user.admin;
        return;
    }

    const output = await api.fetchUser();
    if (output.error || !output.user) {
        return router.push('/404');
    }
    username.value = output.user.username;
    admin.value = output.user.admin;
    loading.value = false;
})

const copied = ref(false);

// A small copy function to copy links
const copy = async(text: string): Promise<void> => {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    sne.value?.addSuccess("Copied!", 1000)
}

// File stuff

const file = ref<File>();
const filePreview = ref<string | undefined>('');
const link = ref('');

const canPreview = computed(() => {
    if (file.value && (file.value.type.startsWith('image') || file.value.type.startsWith('video'))) {
        return true;
    }

    return false;
})

const filePreviewURL = () => {
    if (!file.value) {
        return;
    }

    let previewer = new FileReader();
    previewer.onload = (file => {
        filePreview.value = file.target?.result?.toString();
    })
    previewer.readAsDataURL(file.value);
}

const fileInput = ref<HTMLInputElement>();

const startSelection = () => {
    fileInput.value?.click();
}

const pickFile = () => {
    const files = fileInput.value?.files;
    console.log('hi');
    if (files && files[0]) {
        file.value = files[0];
        filePreviewURL();
        return;
    }
}

// Upload the file time!

const upload = async() => {
    if (!file.value) {
        return;
    }
    const form = new FormData();
    form.append('file', file.value);

    try {
        const uploaded = await api.uploadFile(form);

        if (uploaded.success && uploaded.output) {
            link.value = uploaded.output;
            file.value = undefined;
            filePreview.value = undefined;
            if (fileInput.value) {
                fileInput.value.value = '';
            }
            await copy(link.value);
        } else {
            const err = uploaded.error instanceof Error ? uploaded.error.message : uploaded.error || 'Unknown Shorten Error'
            sne.value?.addError(err);
            console.log(uploaded.response);
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

        sne.value?.addError('Unknown Error Occured while uploading your file');
        console.log(error);
        console.log(typeof error);
        return;
    } 
}
</script>
