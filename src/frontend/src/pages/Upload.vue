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
						<UploadIcon class="w-8 h-8 text-brand inline-block" />
						Upload File
					</h1>
					<p class="text-secondary-text text-sm mt-1">
						Upload images, videos, audio, and documents to your Folderr instance
					</p>
				</div>

				<div class="flex items-center gap-3">
					<router-link
						to="/gallery"
						class="flex items-center gap-2 px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-secondary-text hover:text-text border border-[#3c3c3c] text-sm transition font-medium"
					>
						<PhotographIcon class="w-4 h-4" />
						<span>View Gallery</span>
					</router-link>
				</div>
			</div>

			<!-- Upload Card Container -->
			<div class="bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
				<!-- Hidden File Input -->
				<input
					ref="fileInput"
					type="file"
					class="hidden"
					aria-label="Upload file input"
					@input="pickFile"
				/>

				<!-- Drag & Drop Zone (when no file selected yet) -->
				<div
					v-if="!file"
					@dragover.prevent="isDragging = true"
					@dragleave.prevent="isDragging = false"
					@drop.prevent="onDrop"
					@click="startSelection"
					:class="[
						'border-2 border-dashed rounded-xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center',
						isDragging
							? 'border-brand bg-brand/10 scale-[1.01]'
							: 'border-[#444] hover:border-brand/70 bg-[#202020]/50 hover:bg-[#202020]'
					]"
				>
					<div class="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mb-4 shadow-inner">
						<CloudUploadIcon class="w-8 h-8" />
					</div>
					<h3 class="text-lg font-bold text-text mb-1">
						{{ isDragging ? "Drop your file to upload" : "Click to browse or drag and drop" }}
					</h3>
					<p class="text-secondary-text text-xs sm:text-sm max-w-sm mb-5">
						Supports photos, videos, audio, and documents up to 10GB.
					</p>
					<button
						type="button"
						class="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition flex items-center gap-2"
						@click.stop="startSelection"
					>
						<DocumentAddIcon class="w-4 h-4" />
						<span>Select File</span>
					</button>
				</div>

				<!-- Selected File Preview & Confirmation -->
				<div v-else class="flex flex-col gap-6">
					<!-- File Info Banner -->
					<div class="bg-[#1c1c1c] border border-[#333] rounded-xl p-4 flex items-center justify-between gap-4">
						<div class="flex items-center gap-3 overflow-hidden">
							<div class="w-10 h-10 rounded-lg bg-brand/15 text-brand flex items-center justify-center flex-shrink-0">
								<component :is="getFileTypeIcon()" class="w-6 h-6" />
							</div>
							<div class="overflow-hidden">
								<p class="font-bold text-sm text-text truncate font-mono">{{ file.name }}</p>
								<p class="text-xs text-secondary-text">{{ formatFileSize(file.size) }} • {{ file.type || "Unknown type" }}</p>
							</div>
						</div>
						<button
							@click="cancelFile"
							class="p-2 text-secondary-text hover:text-red-400 hover:bg-white/5 rounded-lg transition"
							title="Remove file"
						>
							<XIcon class="w-5 h-5" />
						</button>
					</div>

					<!-- Visual Media Preview (Images, Videos, Audio) -->
					<div v-if="canPreview" class="bg-[#161616] border border-[#2d2d2d] rounded-xl p-4 flex items-center justify-center max-h-[420px] overflow-hidden">
						<img
							v-if="file?.type.startsWith('image')"
							:src="filePreview"
							alt="Preview"
							class="max-h-[380px] max-w-full rounded-lg object-contain shadow"
						/>
						<video
							v-else-if="file?.type.startsWith('video')"
							:src="filePreview"
							controls
							class="max-h-[380px] max-w-full rounded-lg shadow"
						>
							Your browser cannot play this video preview.
						</video>
						<audio
							v-else-if="file?.type.startsWith('audio')"
							:src="filePreview"
							controls
							class="w-full max-w-md my-4"
						>
							Your browser does not support audio playback.
						</audio>
					</div>

					<!-- Upload Action Controls -->
					<div class="flex items-center justify-end gap-3 pt-2">
						<button
							type="button"
							@click="cancelFile"
							:disabled="uploading"
							class="px-5 py-2.5 rounded-lg bg-transparent hover:bg-[#333] text-secondary-text hover:text-text border border-[#3c3c3c] text-sm font-semibold transition"
						>
							Choose Different File
						</button>
						<button
							type="button"
							@click="upload"
							:disabled="uploading"
							class="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-lg transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
						>
							<Spinner v-if="uploading" class="w-4 h-4" />
							<UploadIcon v-else class="w-4 h-4" />
							<span>{{ uploading ? "Uploading..." : "Upload Now" }}</span>
						</button>
					</div>
				</div>

				<!-- Upload Success Result Box -->
				<div
					v-if="link"
					class="mt-2 bg-[#1b2b20] border border-brand/40 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in"
				>
					<div class="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
						<div class="w-9 h-9 rounded-full bg-brand/20 text-brand flex items-center justify-center flex-shrink-0">
							<CheckCircleIcon class="w-5 h-5" />
						</div>
						<div class="overflow-hidden">
							<p class="text-xs font-semibold text-brand">Uploaded Successfully!</p>
							<a
								:href="link"
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm font-mono text-text hover:underline truncate block"
							>
								{{ link }}
							</a>
						</div>
					</div>

					<div class="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
						<button
							@click="copy(link)"
							class="px-3.5 py-1.5 rounded-lg bg-brand/20 hover:bg-brand hover:text-bg text-brand font-bold text-xs transition flex items-center gap-1.5"
						>
							<ClipboardCheckIcon v-if="copied" class="w-4 h-4" />
							<ClipboardCopyIcon v-else class="w-4 h-4" />
							<span>{{ copied ? "Copied!" : "Copy URL" }}</span>
						</button>
						<a
							:href="link"
							target="_blank"
							rel="noopener noreferrer"
							class="p-1.5 rounded-lg bg-[#243328] hover:bg-[#2c4032] text-brand transition"
							title="Open in new tab"
						>
							<ExternalLinkIcon class="w-4 h-4" />
						</a>
						<button
							@click="link = ''"
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
	UploadIcon,
	PhotographIcon,
	VideoCameraIcon,
	DocumentIcon,
	DocumentAddIcon,
	CloudUploadIcon,
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
const uploading = ref(false);
const username = ref("");
const admin = ref(false);
const isDragging = ref(false);

const file = ref<File>();
const filePreview = ref<string | undefined>("");
const link = ref("");
const copied = ref(false);
const fileInput = ref<HTMLInputElement>();

const canPreview = computed(() => {
	if (!file.value) return false;
	const t = file.value.type;
	return t.startsWith("image") || t.startsWith("video") || t.startsWith("audio");
});

const getFileTypeIcon = () => {
	if (!file.value) return DocumentIcon;
	if (file.value.type.startsWith("image")) return PhotographIcon;
	if (file.value.type.startsWith("video")) return VideoCameraIcon;
	return DocumentIcon;
};

const formatFileSize = (bytes?: number): string => {
	if (!bytes) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	let i = 0;
	let val = bytes;
	while (val >= 1024 && i < units.length - 1) {
		val /= 1024;
		i++;
	}
	return `${val.toFixed(1)} ${units[i]}`;
};

const filePreviewURL = () => {
	if (!file.value) return;
	const reader = new FileReader();
	reader.onload = (e) => {
		filePreview.value = e.target?.result?.toString();
	};
	reader.readAsDataURL(file.value);
};

const startSelection = () => {
	fileInput.value?.click();
};

const pickFile = () => {
	const files = fileInput.value?.files;
	if (files?.[0]) {
		file.value = files[0];
		filePreviewURL();
	}
};

const onDrop = (e: DragEvent) => {
	isDragging.value = false;
	const files = e.dataTransfer?.files;
	if (files?.[0]) {
		file.value = files[0];
		filePreviewURL();
	}
};

const cancelFile = () => {
	file.value = undefined;
	filePreview.value = undefined;
	if (fileInput.value) fileInput.value.value = "";
};

const copy = async (text: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(text);
		copied.value = true;
		sne.value?.addSuccess("Link copied to clipboard!", 2000);
		setTimeout(() => {
			copied.value = false;
		}, 3000);
	} catch {
		sne.value?.addError("Failed to copy link", 2000);
	}
};

const upload = async () => {
	if (!file.value || uploading.value) return;
	uploading.value = true;

	const form = new FormData();
	form.append("file", file.value);

	try {
		const uploaded = await api.uploadFile(form);
		if (uploaded.success && uploaded.output) {
			link.value = uploaded.output;
			cancelFile();
			await copy(link.value);
			sne.value?.addSuccess("File uploaded successfully!", 3000);
		} else {
			const err = uploaded.error instanceof Error
				? uploaded.error.message
				: uploaded.error ?? "Upload failed";
			sne.value?.addError(err, 3000);
		}
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Unexpected upload error";
		sne.value?.addError(msg, 3000);
	} finally {
		uploading.value = false;
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
