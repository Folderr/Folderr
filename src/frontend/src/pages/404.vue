<template>
	<div class="bg-bg min-h-screen flex flex-col text-text">
		<NavbarAuthenticated v-if="username" :username="username" :admin="admin" />
		<FNavbar v-else />

		<main class="container mx-auto px-4 py-16 grow flex flex-col items-center justify-center max-w-2xl text-center">
			<div class="w-20 h-20 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand mb-6 shadow-inner">
				<QuestionMarkCircleIcon class="w-10 h-10" />
			</div>

			<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-brand/15 text-brand border border-brand/30 mb-3">
				404 Error
			</span>

			<h1 class="text-4xl sm:text-5xl font-black text-text tracking-tight mb-3">
				Page Not Found
			</h1>

			<p class="text-secondary-text text-base max-w-md mb-8">
				The link you followed may be broken, or the page may have been removed or renamed.
			</p>

			<div class="flex flex-wrap items-center justify-center gap-3">
				<router-link
					:to="username ? '/gallery' : '/'"
					class="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition flex items-center gap-2"
				>
					<HomeIcon class="w-4 h-4" />
					<span>{{ username ? "Back to Gallery" : "Back to Home" }}</span>
				</router-link>

				<router-link
					v-if="username"
					to="/upload"
					class="px-6 py-2.5 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-text border border-[#3e3e3e] font-semibold text-sm transition flex items-center gap-2"
				>
					<UploadIcon class="w-4 h-4" />
					<span>Upload a File</span>
				</router-link>
			</div>
		</main>

		<FFooter />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "../stores/user.js";
import NavbarAuthenticated from "../components/Navbar-Authenticated.vue";
import FNavbar from "../components/Navbar.vue";
import FFooter from "../components/Footer.vue";
import { QuestionMarkCircleIcon, HomeIcon, UploadIcon } from "@heroicons/vue/solid";

const store = useUserStore();
const username = ref("");
const admin = ref(false);

if (store.username) {
	admin.value = store.admin;
	username.value = store.username;
}
</script>
