<template>
	<nav class="sticky top-0 z-40 w-full bg-[#1e1e1e]/95 backdrop-blur-md border-b border-[#333333] transition-colors">
		<div class="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16">
			<!-- Logo & Mobile Toggle -->
			<div class="flex items-center justify-between w-full lg:w-auto">
				<router-link
					to="/gallery"
					class="flex items-center gap-2.5 text-2xl font-black tracking-tight text-brand hover:opacity-90 transition font-headline"
				>
					<span class="w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-mono font-bold text-lg">
						F
					</span>
					<span>Folderr</span>
				</router-link>

				<button
					class="p-2 rounded-lg text-secondary-text hover:text-text hover:bg-tertiary-bg lg:hidden transition"
					@click="showMenu = !showMenu"
					aria-label="Toggle navigation menu"
				>
					<MenuIcon v-if="!showMenu" class="w-6 h-6" />
					<XIcon v-else class="w-6 h-6" />
				</button>
			</div>

			<!-- Navigation Links (Desktop & Mobile) -->
			<div
				:class="[
					'lg:flex lg:items-center lg:gap-1',
					showMenu
						? 'flex flex-col absolute top-16 left-0 w-full bg-[#1e1e1e] border-b border-[#333333] p-4 space-y-2 shadow-2xl lg:relative lg:top-0 lg:p-0 lg:border-none lg:shadow-none lg:space-y-0'
						: 'hidden lg:flex'
				]"
			>
				<router-link
					to="/gallery"
					:class="[
						'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition',
						isActive('/gallery')
							? 'bg-brand/15 text-brand font-bold'
							: 'text-secondary-text hover:text-text hover:bg-[#2c2c2c]'
					]"
					@click="showMenu = false"
				>
					<PhotographIcon class="w-4 h-4" />
					<span>Gallery</span>
				</router-link>

				<router-link
					to="/upload"
					:class="[
						'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition',
						isActive('/upload')
							? 'bg-brand/15 text-brand font-bold'
							: 'text-secondary-text hover:text-text hover:bg-[#2c2c2c]'
					]"
					@click="showMenu = false"
				>
					<UploadIcon class="w-4 h-4" />
					<span>Upload</span>
				</router-link>

				<router-link
					to="/shorten"
					:class="[
						'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition',
						isActive('/shorten')
							? 'bg-brand/15 text-brand font-bold'
							: 'text-secondary-text hover:text-text hover:bg-[#2c2c2c]'
					]"
					@click="showMenu = false"
				>
					<LinkIcon class="w-4 h-4" />
					<span>Shorten</span>
				</router-link>

				<!-- Admin Dropdown (if admin) -->
				<div v-if="admin" class="relative inline-block text-left">
					<Menu as="div" class="relative">
						<MenuButton
							:class="[
								'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition w-full lg:w-auto',
								isActive('/admin')
									? 'bg-brand/15 text-brand font-bold'
									: 'text-secondary-text hover:text-text hover:bg-[#2c2c2c]'
							]"
						>
							<FingerPrintIcon class="w-4 h-4" />
							<span>Admin</span>
							<ChevronDownIcon class="w-4 h-4 ml-0.5 opacity-70" />
						</MenuButton>

						<transition
							enter-active-class="transition duration-100 ease-out"
							enter-from-class="transform scale-95 opacity-0"
							enter-to-class="transform scale-100 opacity-100"
							leave-active-class="transition duration-75 ease-in"
							leave-from-class="transform scale-100 opacity-100"
							leave-to-class="transform scale-95 opacity-0"
						>
							<MenuItems
								class="absolute left-0 lg:right-0 lg:left-auto mt-2 w-48 rounded-xl bg-[#242424] border border-[#3e3e3e] shadow-2xl p-1.5 focus:outline-none z-50"
							>
								<MenuItem v-slot="{ active }">
									<router-link
										to="/admin/users"
										:class="[
											'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition',
											active ? 'bg-brand text-bg font-bold' : 'text-text hover:bg-[#303030]'
										]"
										@click="showMenu = false"
									>
										<UserIcon class="w-4 h-4" />
										<span>User Management</span>
									</router-link>
								</MenuItem>
							</MenuItems>
						</transition>
					</Menu>
				</div>

				<!-- User Account Dropdown -->
				<div class="relative inline-block text-left lg:ml-2">
					<Menu as="div" class="relative">
						<MenuButton
							:class="[
								'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition w-full lg:w-auto',
								isActive('/account')
									? 'bg-[#2a2a2a] text-brand border-brand/40 shadow-sm'
									: 'bg-[#222222] text-text border-[#383838] hover:bg-[#2c2c2c]'
							]"
						>
							<div class="w-6 h-6 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-xs uppercase">
								{{ username ? username.charAt(0) : "U" }}
							</div>
							<span class="max-w-[120px] truncate text-xs">{{ username || "Account" }}</span>
							<ChevronDownIcon class="w-4 h-4 opacity-70 ml-1" />
						</MenuButton>

						<transition
							enter-active-class="transition duration-100 ease-out"
							enter-from-class="transform scale-95 opacity-0"
							enter-to-class="transform scale-100 opacity-100"
							leave-active-class="transition duration-75 ease-in"
							leave-from-class="transform scale-100 opacity-100"
							leave-to-class="transform scale-95 opacity-0"
						>
							<MenuItems
								class="absolute left-0 lg:right-0 lg:left-auto mt-2 w-48 rounded-xl bg-[#242424] border border-[#3e3e3e] shadow-2xl p-1.5 focus:outline-none z-50"
							>
								<div class="px-3 py-2 border-b border-[#333333] mb-1">
									<p class="text-xs text-secondary-text">Signed in as</p>
									<p class="text-sm font-bold text-text truncate font-mono">{{ username }}</p>
								</div>
								<MenuItem v-slot="{ active }">
									<router-link
										to="/account"
										:class="[
											'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition',
											active ? 'bg-[#333333] text-brand font-semibold' : 'text-text'
										]"
										@click="showMenu = false"
									>
										<CogIcon class="w-4 h-4 text-secondary-text" />
										<span>Settings</span>
									</router-link>
								</MenuItem>
								<MenuItem v-slot="{ active }">
									<button
										:class="[
											'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition text-left',
											active ? 'bg-red-600/20 text-red-400 font-semibold' : 'text-secondary-text hover:text-red-400'
										]"
										@click="logout"
									>
										<LogoutIcon class="w-4 h-4" />
										<span>Logout</span>
									</button>
								</MenuItem>
							</MenuItems>
						</transition>
					</Menu>
				</div>
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { ref } from "vue";
import * as api from "../wrappers/api.js";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../stores/user.js";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import {
	LogoutIcon,
	ChevronDownIcon,
	CogIcon,
	UserIcon,
	FingerPrintIcon,
	UploadIcon,
	PhotographIcon,
	LinkIcon,
	MenuIcon,
	XIcon,
} from "@heroicons/vue/solid";

const router = useRouter();
const route = useRoute();
const store = useUserStore();

const username = ref(store.username ?? "");
const admin = ref(store.admin);

const emit = defineEmits<(e: "error", error: Error | string) => void>();

const showMenu = ref(false);

const isActive = (path: string): boolean => {
	if (!route.path) return false;
	if (path === "/gallery") return route.path === "/gallery";
	return route.path.startsWith(path);
};

const logout = async (): Promise<void> => {
	showMenu.value = false;
	const output = await api.logout();

	if (output.success) {
		store.clear();
		await router.push("/");
		return;
	}

	if (output.error instanceof Error) {
		console.log(`Logout Error: ${output.error.message}`);
		emit("error", output.error);
	} else if (typeof output.error === "string") {
		console.log(`Logout Error: ${output.error}`);
		emit("error", output.error);
	}
};
</script>
