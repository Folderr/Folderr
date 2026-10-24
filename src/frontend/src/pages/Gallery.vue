<template>
	<div v-if="loading">
		<div class="bg-bg h-screen flex flex-col">
			<FNavbar />
			<div
				id="hero"
				class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 grow"
			>
				<Spinner />
				<h1 class="text-secondary-text text-2xl mt-4">
					Loading your gallery...
				</h1>
			</div>
			<FFooter />
		</div>
	</div>
	<div v-else-if="username">
		<div class="bg-bg grow flex flex-col min-h-screen text-text">
			<NavbarAuthenticated :username="username" :admin="admin" />
			<SuccessesErrors ref="sne" />

			<main
				class="container mx-auto px-4 py-8 grow flex flex-col max-w-7xl"
			>
				<!-- Header & Controls -->
				<div
					class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
				>
					<div>
						<h1
							class="text-3xl font-extrabold text-brand tracking-tight flex items-center gap-3"
						>
							<PhotographIcon
								class="w-8 h-8 text-brand inline-block"
							/>
							File Gallery
						</h1>
						<p class="text-secondary-text text-sm mt-1">
							Browse, manage, and share your uploaded images,
							videos, and files
						</p>
					</div>

					<div class="flex items-center gap-3">
						<button
							@click="refreshFiles"
							:disabled="refreshing"
							class="flex items-center gap-2 px-3 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-secondary-text hover:text-text border border-[#3c3c3c] text-sm transition font-medium"
							title="Refresh gallery"
						>
							<RefreshIcon
								:class="[
									'w-4 h-4',
									{ 'animate-spin': refreshing },
								]"
							/>
							<span>Refresh</span>
						</button>
						<router-link
							to="/upload"
							class="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition"
						>
							<UploadIcon class="w-4 h-4" />
							<span>Upload File</span>
						</router-link>
					</div>
				</div>

				<!-- Filters & Search Toolbar -->
				<div
					class="bg-tertiary-bg/70 border border-[#383838] rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
				>
					<!-- Category Tabs -->
					<div
						class="flex items-center gap-1 bg-[#1e1e1e] p-1 rounded-lg border border-[#333333] text-sm"
					>
						<button
							v-for="cat in categories"
							:key="cat.id"
							@click="activeCategory = cat.id"
							:class="[
								'px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 text-xs sm:text-sm',
								activeCategory === cat.id
									? 'bg-brand text-bg font-bold shadow'
									: 'text-secondary-text hover:text-text',
							]"
						>
							<component :is="cat.icon" class="w-4 h-4" />
							<span>{{ cat.label }}</span>
							<span
								:class="[
									'px-1.5 py-0.2 rounded-full text-xs font-semibold',
									activeCategory === cat.id
										? 'bg-bg/20 text-bg'
										: 'bg-[#2a2a2a] text-secondary-text',
								]"
							>
								{{ cat.count }}
							</span>
						</button>
					</div>

					<!-- Search Input -->
					<div class="relative w-full sm:w-72">
						<SearchIcon
							class="w-4 h-4 text-secondary-text absolute left-3 top-1/2 -translate-y-1/2"
						/>
						<input
							v-model="searchQuery"
							type="text"
							placeholder="Search by name or ID..."
							class="w-full bg-[#1e1e1e] border border-[#333333] rounded-lg pl-9 pr-8 py-1.5 text-sm text-text placeholder-secondary-text focus:outline-none focus:border-brand transition"
						/>
						<button
							v-if="searchQuery"
							@click="searchQuery = ''"
							class="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-text"
						>
							<XIcon class="w-4 h-4" />
						</button>
					</div>
				</div>

				<!-- Empty State: No Files at all -->
				<div
					v-if="!loading && allFiles.length === 0"
					class="my-auto py-16 text-center border-2 border-dashed border-[#333333] rounded-2xl bg-tertiary-bg/30 p-8 max-w-lg mx-auto"
				>
					<div
						class="w-16 h-16 rounded-full bg-brand/10 text-brand mx-auto flex items-center justify-center mb-4"
					>
						<PhotographIcon class="w-8 h-8" />
					</div>
					<h2 class="text-xl font-bold text-text mb-2">
						No files uploaded yet
					</h2>
					<p
						class="text-secondary-text text-sm mb-6 max-w-sm mx-auto"
					>
						Your uploaded images, screenshots, videos, and documents
						will appear here in your gallery.
					</p>
					<router-link
						to="/upload"
						class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold shadow-lg transition"
					>
						<UploadIcon class="w-5 h-5" />
						<span>Upload your first file</span>
					</router-link>
				</div>

				<!-- Empty State: Filter/Search Mismatch -->
				<div
					v-else-if="filteredFiles.length === 0"
					class="my-12 text-center py-12 border border-[#333333] rounded-xl bg-tertiary-bg/20 p-8"
				>
					<SearchIcon
						class="w-10 h-10 text-secondary-text mx-auto mb-3 opacity-60"
					/>
					<h3 class="text-lg font-semibold text-text mb-1">
						No matching files found
					</h3>
					<p class="text-secondary-text text-sm mb-4">
						Try adjusting your search query or selecting another
						category.
					</p>
					<button
						@click="resetFilters"
						class="px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] border border-[#444] text-sm text-text transition"
					>
						Clear Filters
					</button>
				</div>

				<!-- Gallery Grid -->
				<div
					v-else
					class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
				>
					<div
						v-for="file in filteredFiles"
						:key="file.id"
						class="group bg-tertiary-bg/90 border border-[#353535] hover:border-brand rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 flex flex-col"
					>
						<!-- Thumbnail Preview Area -->
						<div
							@click="openModal(file)"
							class="relative aspect-video sm:aspect-square bg-[#1a1a1a] cursor-pointer overflow-hidden flex items-center justify-center group-hover:opacity-95"
						>
							<!-- Image -->
							<img
								v-if="
									(file.type === 'image' || isImage(file)) &&
									!imageErrors[file.id]
								"
								:src="file.link"
								:alt="file.filename || file.id"
								loading="lazy"
								class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
								@error="handleImgError($event, file)"
							/>

							<!-- Image Error State Fallback -->
							<div
								v-else-if="imageErrors[file.id]"
								class="w-full h-full flex flex-col items-center justify-center bg-[#202020] text-secondary-text p-4 text-center select-none"
							>
								<PhotographIcon
									class="w-8 h-8 mb-2 opacity-50 text-red-400"
								/>
								<span
									class="text-xs text-secondary-text mb-2 font-medium"
									>Failed to load</span
								>
								<button
									@click.stop="retryImage(file)"
									class="px-2.5 py-1 text-xs rounded bg-[#2e2e2e] hover:bg-brand hover:text-bg text-text transition flex items-center gap-1 font-semibold"
								>
									<RefreshIcon class="w-3 h-3" />
									<span>Retry</span>
								</button>
							</div>

							<!-- Video -->
							<div
								v-else-if="
									file.type === 'video' || isVideo(file)
								"
								class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#242424] to-[#161616] text-blue-400 p-4"
							>
								<VideoCameraIcon
									class="w-12 h-12 mb-2 opacity-80 group-hover:scale-110 transition duration-200"
								/>
								<span
									class="text-xs uppercase font-mono tracking-wider font-semibold text-secondary-text"
								>
									{{ file.ext || "Video" }}
								</span>
							</div>

							<!-- Generic File -->
							<div
								v-else
								class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#242424] to-[#161616] text-emerald-400 p-4"
							>
								<DocumentIcon
									class="w-12 h-12 mb-2 opacity-80 group-hover:scale-110 transition duration-200"
								/>
								<span
									class="text-xs uppercase font-mono tracking-wider font-semibold text-secondary-text"
								>
									{{ file.ext || "File" }}
								</span>
							</div>

							<!-- Hover Overlay with Quick Action Buttons -->
							<div
								class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2"
							>
								<button
									@click.stop="openModal(file)"
									class="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition"
									title="View details"
								>
									<EyeIcon class="w-5 h-5" />
								</button>
								<button
									@click.stop="copyLink(file.link)"
									class="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition"
									title="Copy link"
								>
									<ClipboardCopyIcon class="w-5 h-5" />
								</button>
								<a
									:href="file.link"
									target="_blank"
									rel="noopener noreferrer"
									@click.stop
									class="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition"
									title="Open directly in new tab"
								>
									<ExternalLinkIcon class="w-5 h-5" />
								</a>
								<button
									@click.stop="requestDelete(file)"
									class="p-2 rounded-full bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white backdrop-blur-sm transition"
									title="Delete file"
								>
									<TrashIcon class="w-5 h-5" />
								</button>
							</div>

							<!-- Type badge top-right -->
							<span
								class="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white/90"
							>
								{{ file.ext || file.type }}
							</span>
						</div>

						<!-- Card Info Footer -->
						<div
							class="p-3 border-t border-[#333333] flex items-center justify-between text-xs bg-[#222222]"
						>
							<div
								class="truncate mr-2 font-mono text-secondary-text"
								:title="file.filename || file.id"
							>
								{{ file.filename || file.id }}
							</div>
							<span
								class="text-secondary-text whitespace-nowrap text-[11px]"
							>
								{{ formatDate(file.created) }}
							</span>
						</div>
					</div>
				</div>
			</main>

			<!-- Lightbox / Details Modal -->
			<div
				v-if="selectedFile"
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
				@click.self="selectedFile = null"
			>
				<div
					class="bg-[#242424] border border-[#444] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
				>
					<!-- Modal Header -->
					<div
						class="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#2a2a2a]"
					>
						<div class="flex items-center gap-3 truncate mr-4">
							<span
								class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-brand text-bg"
							>
								{{ selectedFile.type }}
							</span>
							<h3
								class="text-lg font-bold text-text truncate font-mono"
							>
								{{ selectedFile.filename || selectedFile.id }}
							</h3>
						</div>
						<button
							@click="selectedFile = null"
							class="p-1 rounded-lg text-secondary-text hover:text-text hover:bg-white/10 transition"
						>
							<XIcon class="w-6 h-6" />
						</button>
					</div>

					<!-- Modal Body / Media Preview -->
					<div
						class="p-6 overflow-y-auto grow flex flex-col items-center justify-center bg-[#181818] min-h-[300px]"
					>
						<!-- Image Viewer -->
						<img
							v-if="
								(selectedFile.type === 'image' ||
									isImage(selectedFile)) &&
								!imageErrors[selectedFile.id]
							"
							:src="selectedFile.link"
							:alt="selectedFile.filename || selectedFile.id"
							class="max-h-[55vh] w-auto max-w-full rounded-lg object-contain shadow-md"
							@error="handleImgError($event, selectedFile)"
						/>
						<div
							v-else-if="imageErrors[selectedFile.id]"
							class="text-center py-12 px-6 flex flex-col items-center"
						>
							<PhotographIcon
								class="w-16 h-16 text-red-400 mb-3 opacity-80"
							/>
							<p class="text-text font-bold text-base mb-1">
								Image preview unavailable
							</p>
							<p class="text-secondary-text text-xs mb-4">
								The image could not be loaded directly.
							</p>
							<button
								@click="retryImage(selectedFile)"
								class="px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-brand hover:text-bg text-text text-xs font-bold transition flex items-center gap-1.5"
							>
								<RefreshIcon class="w-4 h-4" />
								<span>Retry Loading</span>
							</button>
						</div>

						<!-- Video Player -->
						<video
							v-else-if="
								selectedFile.type === 'video' ||
								isVideo(selectedFile)
							"
							:src="selectedFile.link"
							controls
							autoplay
							class="max-h-[55vh] w-auto max-w-full rounded-lg shadow-md"
						>
							Your browser cannot play this video.
						</video>

						<!-- Generic File Download Box -->
						<div
							v-else
							class="text-center py-12 px-6 flex flex-col items-center"
						>
							<DocumentIcon
								class="w-20 h-20 text-brand mb-4 opacity-90"
							/>
							<p class="text-text font-bold text-lg mb-1">
								{{ selectedFile.filename || selectedFile.id }}
							</p>
							<p class="text-secondary-text text-sm mb-6">
								{{
									selectedFile.mimetype ||
									"Unknown file format"
								}}
							</p>
							<a
								:href="selectedFile.link"
								download
								target="_blank"
								class="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow transition inline-flex items-center gap-2"
							>
								<ExternalLinkIcon class="w-4 h-4" />
								<span>Download File</span>
							</a>
						</div>
					</div>

					<!-- Modal Footer & Metadata Details -->
					<div
						class="p-5 border-t border-[#333] bg-[#222222] flex flex-col sm:flex-row items-center justify-between gap-4"
					>
						<!-- Direct Link Copy Box -->
						<div
							class="flex items-center bg-[#181818] border border-[#383838] rounded-lg px-3 py-1.5 w-full sm:w-auto sm:grow max-w-lg"
						>
							<span
								class="text-xs text-secondary-text mr-2 font-mono truncate"
							>
								{{ selectedFile.link }}
							</span>
							<button
								@click="copyLink(selectedFile.link)"
								class="ml-auto text-brand hover:text-brand-darkened p-1 transition"
								title="Copy link"
							>
								<ClipboardCopyIcon class="w-4 h-4" />
							</button>
						</div>

						<!-- Action Buttons -->
						<div
							class="flex items-center gap-2 w-full sm:w-auto justify-end"
						>
							<a
								:href="selectedFile.link"
								target="_blank"
								rel="noopener noreferrer"
								class="px-3 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] border border-[#444] text-xs font-semibold text-text transition flex items-center gap-1.5"
							>
								<ExternalLinkIcon class="w-4 h-4" />
								<span>Open Full</span>
							</a>
							<button
								@click="requestDelete(selectedFile)"
								class="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-600/30 text-xs font-semibold transition flex items-center gap-1.5"
							>
								<TrashIcon class="w-4 h-4" />
								<span>Delete</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Delete Confirmation Modal -->
			<div
				v-if="fileToDelete"
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
				@click.self="fileToDelete = null"
			>
				<div
					class="bg-[#242424] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl"
				>
					<div
						class="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4 mx-auto"
					>
						<TrashIcon class="w-6 h-6" />
					</div>
					<h3 class="text-xl font-bold text-center text-text mb-2">
						Delete File
					</h3>
					<p class="text-secondary-text text-sm text-center mb-6">
						Are you sure you want to delete
						<span class="font-mono text-white font-semibold">{{
							fileToDelete.filename || fileToDelete.id
						}}</span
						>? This action is permanent and cannot be undone.
					</p>
					<div class="flex items-center justify-end gap-3">
						<button
							@click="fileToDelete = null"
							class="px-4 py-2 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-secondary-text hover:text-text border border-[#444] text-sm transition"
						>
							Cancel
						</button>
						<button
							@click="confirmDelete"
							:disabled="deleting"
							class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow transition flex items-center gap-2"
						>
							<TrashIcon class="w-4 h-4" />
							<span>{{
								deleting ? "Deleting..." : "Yes, Delete"
							}}</span>
						</button>
					</div>
				</div>
			</div>

			<FFooter />
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	ClipboardCopyIcon,
	CollectionIcon,
	DocumentIcon,
	ExternalLinkIcon,
	EyeIcon,
	PhotographIcon,
	RefreshIcon,
	SearchIcon,
	TrashIcon,
	UploadIcon,
	VideoCameraIcon,
	XIcon,
} from "@heroicons/vue/outline";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import FFooter from "../components/Footer.vue";
import FNavbar from "../components/Navbar.vue";
import NavbarAuthenticated from "../components/Navbar-Authenticated.vue";
import Spinner from "../components/Spinner.vue";
import SuccessesErrors from "../components/Success-N-Error.vue";
import { useUserStore } from "../stores/user.js";
import type { UserFile } from "../wrappers/api.js";
import * as api from "../wrappers/api.js";

const store = useUserStore();
const router = useRouter();

const loading = ref(true);
const refreshing = ref(false);
const deleting = ref(false);
const username = ref("");
const admin = ref(false);

const allFiles = ref<UserFile[]>([]);
const searchQuery = ref("");
const activeCategory = ref<"all" | "image" | "video" | "file">("all");

const selectedFile = ref<UserFile | null>(null);
const fileToDelete = ref<UserFile | null>(null);

const sne = ref<
	InstanceType<typeof SuccessesErrors> & {
		addError: (msg: string, time?: number) => void;
		addSuccess: (msg: string, time?: number) => void;
	}
>();

// Helpers to identify file types
const isImage = (file: UserFile): boolean => {
	if (file.type === "image") return true;
	if (file.mimetype?.startsWith("image/")) return true;
	const ext = (file.ext || "").toLowerCase();
	return [
		"png",
		"jpg",
		"jpeg",
		"gif",
		"webp",
		"svg",
		"bmp",
		"ico",
		"avif",
	].includes(ext);
};

const isVideo = (file: UserFile): boolean => {
	if (file.type === "video") return true;
	if (file.mimetype?.startsWith("video/")) return true;
	const ext = (file.ext || "").toLowerCase();
	return ["mp4", "webm", "mov", "mkv", "avi", "m4v"].includes(ext);
};

// Filtered files computed property
const filteredFiles = computed(() => {
	let list = allFiles.value;

	// Filter by Category
	if (activeCategory.value === "image") {
		list = list.filter((f) => isImage(f));
	} else if (activeCategory.value === "video") {
		list = list.filter((f) => isVideo(f));
	} else if (activeCategory.value === "file") {
		list = list.filter((f) => !isImage(f) && !isVideo(f));
	}

	// Filter by Search Query
	if (searchQuery.value.trim()) {
		const q = searchQuery.value.toLowerCase().trim();
		list = list.filter((f) => {
			const idMatch = f.id?.toLowerCase().includes(q);
			const nameMatch = f.filename?.toLowerCase().includes(q);
			const extMatch = f.ext?.toLowerCase().includes(q);
			return idMatch || nameMatch || extMatch;
		});
	}

	return list;
});

// Category tabs with counts
const categories = computed(() => {
	const total = allFiles.value.length;
	const imgCount = allFiles.value.filter((f) => isImage(f)).length;
	const vidCount = allFiles.value.filter((f) => isVideo(f)).length;
	const docCount = allFiles.value.filter(
		(f) => !isImage(f) && !isVideo(f),
	).length;

	return [
		{
			id: "all" as const,
			label: "All Items",
			icon: CollectionIcon,
			count: total,
		},
		{
			id: "image" as const,
			label: "Images",
			icon: PhotographIcon,
			count: imgCount,
		},
		{
			id: "video" as const,
			label: "Videos",
			icon: VideoCameraIcon,
			count: vidCount,
		},
		{
			id: "file" as const,
			label: "Files",
			icon: DocumentIcon,
			count: docCount,
		},
	];
});

const resetFilters = () => {
	searchQuery.value = "";
	activeCategory.value = "all";
};

// Fetch files from the backend
const fetchFiles = async () => {
	try {
		const res = await api.getFiles(true, 100);
		if (res.success && res.message) {
			allFiles.value = res.message;
		} else if (res.error) {
			sne.value?.addError(
				typeof res.error === "string"
					? res.error
					: "Failed to load files",
				3000,
			);
		}
	} catch (err: unknown) {
		console.error(err);
		sne.value?.addError("Failed to fetch gallery files", 3000);
	}
};

const refreshFiles = async () => {
	refreshing.value = true;
	await fetchFiles();
	refreshing.value = false;
	sne.value?.addSuccess("Gallery refreshed", 1500);
};

// Formatter for timestamp
const formatDate = (seconds?: number): string => {
	if (!seconds) return "";
	const date = new Date(seconds * 1000);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

	if (diffHours < 1) {
		const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
		return `${diffMins}m ago`;
	}
	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}

	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

const copyLink = async (url: string) => {
	try {
		await navigator.clipboard.writeText(url);
		sne.value?.addSuccess("Direct link copied to clipboard!", 2000);
	} catch {
		sne.value?.addError("Unable to copy to clipboard", 2000);
	}
};

const openModal = (file: UserFile) => {
	selectedFile.value = file;
};

const requestDelete = (file: UserFile) => {
	fileToDelete.value = file;
};

const confirmDelete = async () => {
	if (!fileToDelete.value) return;
	const target = fileToDelete.value;
	deleting.value = true;

	try {
		const res = await api.deleteFile(target.id);
		if (res.success) {
			allFiles.value = allFiles.value.filter((f) => f.id !== target.id);
			if (selectedFile.value?.id === target.id) {
				selectedFile.value = null;
			}
			sne.value?.addSuccess("File deleted successfully", 2000);
		} else {
			sne.value?.addError(
				typeof res.error === "string"
					? res.error
					: "Failed to delete file",
				3000,
			);
		}
	} catch (err: unknown) {
		console.error(err);
		sne.value?.addError(
			"An unexpected error occurred while deleting",
			3000,
		);
	} finally {
		deleting.value = false;
		fileToDelete.value = null;
	}
};

const imageErrors = reactive<Record<string, boolean>>({});
const retryCounts = reactive<Record<string, number>>({});

const handleImgError = (event: Event, file: UserFile) => {
	const currentRetries = retryCounts[file.id] || 0;
	if (currentRetries < 2) {
		retryCounts[file.id] = currentRetries + 1;
		setTimeout(
			() => {
				const img = event.target as HTMLImageElement;
				if (img) {
					const url = new URL(file.link, window.location.origin);
					url.searchParams.set("_retry", Date.now().toString());
					img.src = url.toString();
				}
			},
			400 * (currentRetries + 1),
		);
	} else {
		imageErrors[file.id] = true;
	}
};

const retryImage = (file: UserFile) => {
	imageErrors[file.id] = false;
	retryCounts[file.id] = 0;
};

// Keyboard shortcut (Escape to close modal)
const onKeyDown = (e: KeyboardEvent) => {
	if (e.key === "Escape") {
		if (fileToDelete.value) {
			fileToDelete.value = null;
		} else if (selectedFile.value) {
			selectedFile.value = null;
		}
	}
};

onMounted(async () => {
	window.addEventListener("keydown", onKeyDown);

	if (store.username) {
		username.value = store.username;
		admin.value = store.admin;
	} else {
		await store.loadUser();
		if (!store.username) {
			return router.push("/404");
		}
		username.value = store.username;
		admin.value = store.admin;
	}

	await fetchFiles();
	loading.value = false;
});

onUnmounted(() => {
	window.removeEventListener("keydown", onKeyDown);
});
</script>
