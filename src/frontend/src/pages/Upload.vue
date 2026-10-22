<template>
    <div v-if="loading">
        <div class="bg-bg h-screen flex flex-col ">
            <FNavbar />
            <div
                id="hero"
                class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 grow"
            >
                <h1 class="text-secondary-text text-3xl mb-8">Loading...</h1>
            </div>
        </div>
        <FFooter />
    </div>
    <div v-if="username">
        <div class="bg-bg grow flex flex-col min-h-screen">
            <NavbarAuthenticated :username="username" :admin="admin"/>
            <SuccessesErrors ref="sne" />
            <div
                id="hero"
                :class="[
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
                <div
                    v-if="canPreview"
                    class="p-1  m-auto mb-8
                        bg-tertiary-bg
                        border-4 border-tertiary-bg text-center max-w-xl w-max">
                    <img
                        v-if="file?.type.startsWith('image')"
                        class="m-auto"
                        :src="filePreview"
                    >
                    <video
                        v-if="file?.type.startsWith('video')"
                        :src="filePreview"
                        controls
                        class="m-auto"
                    >
                        <source :src="filePreview" :type="file?.type">
                        Your browser can't play this video :(
                        <br>No preview for you
                    </video>
                    <audio
                        v-if="file?.type.startsWith('audio')"
                        controls
                        class="m-auto "
                        :src="filePreview"
                        :type="file?.type"
                    >
                        Your browser does not support this audio format :(
                    </audio>
                </div>
                <input
                    ref="fileInput"
                    type="file"
                    hidden="true"
                    label="File upload input box, hidden from view"
                    @input="pickFile"
                >
                <div
                    v-if="link"
                    class="
                        flex justify-center flex-shrink
                        items-center bg-tertiary-bg
                        mx-auto w-min p-2 mb-8
                        border-2 rounded-lg
                        border-tertiary-bg text-brand
                    ">
                    {{link}}
                    <button v-if="link" class="ml-4 text-brand p-2 px-4" @click="copy(link)">
                        <ClipboardCopyIcon
                            v-if="!copied"
                            class="h-5 w-5 text-brand-darkened hover:text-brand"
                            aria-hidden="true"
                            />
                        <ClipboardCheckIcon
                            v-if="copied"
                            class="h-5 w-5 text-brand-darkened hover:text-brand"
                            aria-hidden="true"
                            />
                    </button>
                    <button v-if="link" class="text-brand pr-4" @click="link = ''">
                        <XIcon class="text-brand hover:text-brand h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
                <div class="flex justify-center">
                    <FButton
                        :on-click="startSelection"
                        buttontitle="Pick a File to Upload"
                        class="px-4 p-2"
                    >Pick a file</FButton>
                    <FButton
                        v-if="file"
                        :on-click="upload"
                        buttontitle="Shorten the Link!"
                        class="p-2 ml-4"
                    >Upload!</FButton>
                </div>
            </div>
            <FFooter />
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {useUserStore} from '../stores/user.js';
import {useRouter} from 'vue-router';
import {ClipboardCopyIcon, ClipboardCheckIcon, XIcon} from '@heroicons/vue/solid';
import * as api from '../wrappers/api.js';
import SuccessesErrors from "../components/Success-N-Error.vue";

// Setup store & router
const store = useUserStore();
const router = useRouter();

// Setup components
const sne = ref();

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    sne.value?.addSuccess("Copied!", 1000)
}

// File stuff

const file = ref<File>();
const filePreview = ref<string | undefined>('');
const audioPreview = ref();
const link = ref('');

const canPreview = computed(() => {
    console.log(file.value?.type)
    if (
        file.value && (
            file.value.type.startsWith('image') ||
            file.value.type.startsWith('video') ||
            file.value.type.startsWith('audio'))
    ) {
        return true;
    }

    return false;
})

// eslint-disable-next-line @typescript-eslint/naming-convention
const filePreviewURL = () => {
    if (!file.value) {
        return;
    }

    const previewer = new FileReader();
    previewer.onload = (file => {
        filePreview.value = file.target?.result?.toString();
        if (file.type.startsWith('audio')) {
            audioPreview.value = file.target?.result
        }
    })
    previewer.readAsDataURL(file.value);
}

const fileInput = ref<HTMLInputElement>();

const startSelection = () => {
    fileInput.value?.click();
}

const pickFile = () => {
    const files = fileInput.value?.files;
    if (files?.[0]) {
        file.value = files[0];
        filePreviewURL();

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
            const err = uploaded.error instanceof Error ?
                uploaded.error.message :
                uploaded.error ?? 'Unknown Upload Error'
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            sne.value?.addError(err);
            console.log(uploaded.response);
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
        sne.value?.addError('Unknown Error Occured while uploading your file');
        console.log(error);
        console.log(typeof error);

    }
}
</script>

<style>
.active {
    background-color: #282828;
}
</style>
