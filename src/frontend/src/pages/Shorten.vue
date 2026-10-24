<template>
	<div v-if="loading" class="bg-bg min-h-screen flex flex-col">
		<NavbarAuthenticated v-if="username" :username="username" :admin="admin" />
		<FNavbar v-else />
		<div class="m-auto text-center py-24 grow flex flex-col items-center justify-center">
			<Spinner />
			<h2 class="text-secondary-text text-xl mt-4 font-medium">Loading Folderr...</h2>
		</div>
		<FFooter />
	</div>

	<div v-else-if="username" class="bg-bg min-h-screen flex flex-col text-text">
		<NavbarAuthenticated :username="username" :admin="admin" />
		<SuccessesErrors ref="sne" />

		<main class="container mx-auto px-4 py-8 grow flex flex-col max-w-5xl">
			<!-- Page Header -->
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
				<div>
					<h1 class="text-3xl font-extrabold text-brand tracking-tight flex items-center gap-3">
						<LinkIcon class="w-8 h-8 text-brand inline-block" />
						Shorten Link
					</h1>
					<p class="text-secondary-text text-sm mt-1">
						Generate fast, secure, and trackable shortened URLs instantly
					</p>
				</div>

				<div class="flex items-center gap-3">
					<router-link
						to="/upload"
						class="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-secondary-text hover:text-text border border-[#3c3c3c] text-sm transition font-medium"
					>
						<UploadIcon class="w-4 h-4" />
						<span>Upload File</span>
					</router-link>
					<router-link
						to="/gallery"
						class="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-secondary-text hover:text-text border border-[#3c3c3c] text-sm transition font-medium"
					>
						<PhotographIcon class="w-4 h-4" />
						<span>View Gallery</span>
					</router-link>
				</div>
			</div>

			<!-- Main Shortener Card -->
			<div class="bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
				<form @submit.prevent="shorten" class="flex flex-col gap-4">
					<label for="url-input" class="text-sm font-semibold text-secondary-text flex items-center gap-2">
						<span>Target Destination URL</span>
					</label>

					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
						<div class="relative grow">
							<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary-text">
								<GlobeAltIcon class="w-5 h-5" />
							</div>
							<input
								id="url-input"
								ref="linkBox"
								v-model="link"
								type="url"
								placeholder="https://example.com/very/long/destination/url"
								required
								:class="[
									'w-full bg-[#181818] border rounded-xl pl-11 pr-10 py-3 text-sm text-text placeholder-secondary-text/60 focus:outline-none transition',
									link && !isLinkValid
										? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
										: 'border-[#383838] focus:border-brand focus:ring-1 focus:ring-brand'
								]"
							/>
							<button
								v-if="link"
								type="button"
								@click="link = ''"
								class="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-text"
							>
								<XIcon class="w-4 h-4" />
							</button>
						</div>

						<button
							type="submit"
							:disabled="!isLinkValid || isShortening"
							class="px-7 py-3 rounded-xl bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
						>
							<Spinner v-if="isShortening" class="w-4 h-4" />
							<LinkIcon v-else class="w-4 h-4" />
							<span>{{ isShortening ? "Shortening..." : "Shorten URL" }}</span>
						</button>
					</div>

					<p v-if="link && !isLinkValid" class="text-xs text-red-400 pl-1">
						Please enter a valid URL beginning with http:// or https://
					</p>
				</form>

				<!-- Success Result Display -->
				<div
					v-if="shortenedLink"
					class="mt-2 bg-[#1b2b20] border border-brand/40 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in"
				>
					<div class="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
						<div class="w-9 h-9 rounded-full bg-brand/20 text-brand flex items-center justify-center flex-shrink-0">
							<CheckCircleIcon class="w-5 h-5" />
						</div>
						<div class="overflow-hidden">
							<p class="text-xs font-semibold text-brand">Short Link Ready!</p>
							<a
								:href="shortenedLink"
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm font-mono text-text hover:underline truncate block"
							>
								{{ shortenedLink }}
							</a>
						</div>
					</div>

					<div class="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
						<button
							@click="copy(shortenedLink)"
							class="px-3.5 py-1.5 rounded-lg bg-brand/20 hover:bg-brand hover:text-bg text-brand font-bold text-xs transition flex items-center gap-1.5"
						>
							<ClipboardCheckIcon v-if="copied" class="w-4 h-4" />
							<ClipboardCopyIcon v-else class="w-4 h-4" />
							<span>{{ copied ? "Copied!" : "Copy Short URL" }}</span>
						</button>
						<a
							:href="shortenedLink"
							target="_blank"
							rel="noopener noreferrer"
							class="p-1.5 rounded-lg bg-[#243328] hover:bg-[#2c4032] text-brand transition"
							title="Test link in new tab"
						>
							<ExternalLinkIcon class="w-4 h-4" />
						</a>
						<button
							@click="shortenedLink = ''"
							class="p-1.5 rounded-lg hover:bg-white/10 text-secondary-text hover:text-text transition"
							title="Dismiss"
						>
							<XIcon class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</main>

		<FFooter />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useUserStore } from "../stores/user.js";
import { useRouter } from "vue-router";
import NavbarAuthenticated from "../components/Navbar-Authenticated.vue";
import FNavbar from "../components/Navbar.vue";
import FFooter from "../components/Footer.vue";
import Spinner from "../components/Spinner.vue";
import SuccessesErrors from "../components/Success-N-Error.vue";
import * as api from "../wrappers/api.js";
import {
	LinkIcon,
	GlobeAltIcon,
	UploadIcon,
	PhotographIcon,
	ClipboardCopyIcon,
	ClipboardCheckIcon,
	ExternalLinkIcon,
	CheckCircleIcon,
	XIcon,
} from "@heroicons/vue/solid";

const store = useUserStore();
const router = useRouter();

const sne = ref<InstanceType<typeof SuccessesErrors> & {
	addError: (msg: string, time?: number) => void;
	addSuccess: (msg: string, time?: number) => void;
}>();

const loading = ref(true);
const isShortening = ref(false);
const username = ref("");
const admin = ref(false);

const link = ref("");
const shortenedLink = ref("");
const copied = ref(false);
const linkBox = ref<HTMLInputElement>();

const isLinkValid = computed(() => {
	if (!link.value.trim()) return false;
	try {
		const u = new URL(link.value.trim());
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
});

const copy = async (text: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(text);
		copied.value = true;
		sne.value?.addSuccess("Short link copied to clipboard!", 2000);
		setTimeout(() => {
			copied.value = false;
		}, 3000);
	} catch {
		sne.value?.addError("Unable to copy to clipboard", 2000);
	}
};

const shorten = async () => {
	if (!isLinkValid.value || isShortening.value) {
		sne.value?.addError("Please enter a valid URL (e.g. https://example.com)", 2000);
		return;
	}

	isShortening.value = true;

	try {
		const shortened = await api.shortenLink(new URL(link.value.trim()));
		if (shortened.success && shortened.output) {
			shortenedLink.value = shortened.output;
			link.value = "";
			await copy(shortened.output);
			sne.value?.addSuccess("Link shortened successfully!", 2500);
			linkBox.value?.blur();
		} else {
			const err = shortened.error instanceof Error
				? shortened.error.message
				: shortened.error ?? "Failed to shorten URL";
			sne.value?.addError(err, 3000);
		}
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Unexpected error shortening URL";
		sne.value?.addError(msg, 3000);
	} finally {
		isShortening.value = false;
	}
};

onMounted(async () => {
	if (store.username) {
		username.value = store.username;
		admin.value = store.admin;
		loading.value = false;
		return;
	}

	await store.loadUser();
	if (!store.username) {
		return router.push("/404");
	}

	username.value = store.username;
	admin.value = store.admin;
	loading.value = false;
});
</script>
