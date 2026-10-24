<template>
	<div class="bg-bg min-h-screen flex flex-col text-text">
		<FNavbar />

		<main class="container mx-auto px-4 py-16 grow flex flex-col items-center justify-center max-w-xl text-center">
			<div class="bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-8 sm:p-10 shadow-xl flex flex-col items-center">
				<div class="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mb-5">
					<HeartIcon class="w-8 h-8 text-brand" />
				</div>

				<h1 class="text-3xl font-extrabold text-brand tracking-tight mb-2">
					Farewell
				</h1>
				<p class="text-secondary-text text-base mb-6">
					Hopefully this isn't the last time we see you.
				</p>

				<div class="bg-[#1c1c1c] border border-[#333] rounded-xl p-4 text-xs text-secondary-text text-left w-full mb-8">
					<p class="font-bold text-text mb-1">Account Data Deletion</p>
					<p>
						Your account and associated files, images, shortened links, and session tokens are scheduled for permanent removal from this Folderr instance.
					</p>
				</div>

				<router-link
					to="/"
					class="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition"
				>
					Return to Home
				</router-link>
			</div>
		</main>

		<FFooter />
	</div>
</template>

<script setup lang="ts">
import FNavbar from "../../components/Navbar.vue";
import FFooter from "../../components/Footer.vue";
import { HeartIcon } from "@heroicons/vue/solid";
</script>
