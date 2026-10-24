<template>
	<nav
		class="sticky top-0 z-40 w-full bg-[#1e1e1e]/95 backdrop-blur-md border-b border-[#333333] transition-colors"
	>
		<div
			class="container mx-auto px-4 max-w-7xl flex items-center justify-between h-16"
		>
			<!-- Logo -->
			<div class="flex items-center justify-between w-full md:w-auto">
				<router-link
					to="/"
					class="flex items-center gap-2.5 text-2xl font-black tracking-tight text-brand hover:opacity-90 transition font-headline"
				>
					<span
						class="w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-mono font-bold text-lg"
					>
						F
					</span>
					<span>Folderr</span>
				</router-link>

				<button
					type="button"
					class="p-2 rounded-lg text-secondary-text hover:text-text hover:bg-tertiary-bg md:hidden transition"
					@click="showMenu = !showMenu"
					aria-label="Toggle navigation menu"
				>
					<MenuIcon v-if="!showMenu" class="w-6 h-6" />
					<XIcon v-else class="w-6 h-6" />
				</button>
			</div>

			<!-- Navigation Links -->
			<div
				:class="[
					'md:flex md:items-center md:gap-3',
					showMenu
						? 'flex flex-col absolute top-16 left-0 w-full bg-[#1e1e1e] border-b border-[#333333] p-4 space-y-3 shadow-2xl md:relative md:top-0 md:p-0 md:border-none md:shadow-none md:space-y-0'
						: 'hidden md:flex',
				]"
			>
				<router-link
					to="/"
					class="px-3.5 py-2 rounded-lg text-sm font-semibold transition text-secondary-text hover:text-text hover:bg-[#2c2c2c]"
					@click="showMenu = false"
				>
					Home
				</router-link>

				<a
					href="https://github.com/Folderr/Folderr"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-secondary-text hover:text-text hover:bg-[#2c2c2c] transition"
				>
					<Icon :icon="github" class="w-4 h-4" />
					<span>GitHub</span>
				</a>

				<div
					class="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#333333]"
				>
					<router-link
						to="/#login"
						class="px-4 py-1.5 rounded-lg text-sm font-bold text-text border border-[#3e3e3e] hover:bg-[#2c2c2c] transition text-center"
						@click="showMenu = false"
					>
						Log In
					</router-link>
					<router-link
						to="/signup#signup"
						class="px-4 py-1.5 rounded-lg text-sm font-bold text-bg bg-brand hover:bg-brand-darkened shadow transition text-center"
						@click="showMenu = false"
					>
						Sign Up
					</router-link>
				</div>
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { MenuIcon, XIcon } from "@heroicons/vue/solid";
import { Icon } from "@iconify/vue";
import github from "@iconify-icons/codicon/github-inverted";
import { ref } from "vue";

defineProps<{
	url?:
		| "/"
		| "/info"
		| "/signup"
		| "/signup/success"
		| "/account/deny"
		| "/account/verify"
		| string;
	width?: number;
}>();

const showMenu = ref(false);
</script>
