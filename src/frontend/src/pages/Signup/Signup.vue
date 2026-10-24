<template>
	<div class="bg-bg min-h-screen flex flex-col text-text">
		<FNavbar url="/signup" :width="width" />
		<SuccessesErrors ref="sne" />

		<main class="container mx-auto px-4 py-12 lg:py-16 max-w-7xl grow flex items-center">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
				<!-- Left Column: Hero & Features -->
				<div class="lg:col-span-7 flex flex-col">
					<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 border border-brand/20 text-brand w-fit mb-4">
						<span class="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
						<span>Create Your Account</span>
					</div>

					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-text tracking-tight font-headline mb-4 leading-tight">
						Join Your <span class="text-brand">Folderr</span> Instance.
					</h1>

					<p class="text-secondary-text text-base sm:text-lg mb-8 max-w-xl font-info">
						Sign up to start uploading high-resolution photos, videos, and managing short links with complete privacy.
					</p>

					<!-- Feature Badges Grid -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="bg-[#222222]/80 border border-[#333333] rounded-xl p-4 transition hover:border-[#444]">
							<div class="flex items-center gap-2.5 mb-1 text-brand font-bold text-sm">
								<ServerIcon class="w-4 h-4" />
								<span>Self-Hostable</span>
							</div>
							<p class="text-xs text-secondary-text leading-relaxed">
								Deploy effortlessly on any Linux server, container, or home lab environment.
							</p>
						</div>

						<div class="bg-[#222222]/80 border border-[#333333] rounded-xl p-4 transition hover:border-[#444]">
							<div class="flex items-center gap-2.5 mb-1 text-brand font-bold text-sm">
								<CodeIcon class="w-4 h-4" />
								<span>100% Open Source</span>
							</div>
							<p class="text-xs text-secondary-text leading-relaxed">
								Fully auditable code under the AGPL-3.0 license. No telemetry or hidden trackers.
							</p>
						</div>

						<div class="bg-[#222222]/80 border border-[#333333] rounded-xl p-4 transition hover:border-[#444]">
							<div class="flex items-center gap-2.5 mb-1 text-brand font-bold text-sm">
								<ShieldCheckIcon class="w-4 h-4" />
								<span>Private & Unbiased</span>
							</div>
							<p class="text-xs text-secondary-text leading-relaxed">
								You own all your images, links, and content. Your server, your data.
							</p>
						</div>

						<div class="bg-[#222222]/80 border border-[#333333] rounded-xl p-4 transition hover:border-[#444]">
							<div class="flex items-center gap-2.5 mb-1 text-brand font-bold text-sm">
								<GlobeAltIcon class="w-4 h-4" />
								<span>Custom Domains</span>
							</div>
							<p class="text-xs text-secondary-text leading-relaxed">
								Use custom domains, vanity URLs, and ShareX desktop integration.
							</p>
						</div>
					</div>
				</div>

				<!-- Right Column: Signup Card -->
				<div class="lg:col-span-5 flex justify-center">
					<div
						id="signup"
						class="w-full max-w-md bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-md"
					>
						<Signup :sne="sne" />

						<div class="mt-6 pt-6 border-t border-[#333] flex flex-col items-center gap-3 text-xs">
							<div class="flex items-center gap-1.5 text-secondary-text">
								<span>Already have an account?</span>
								<router-link
									to="/#login"
									class="text-brand font-bold hover:underline"
								>
									Log In
								</router-link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>

		<FFooter />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import FNavbar from "../../components/Navbar.vue";
import FFooter from "../../components/Footer.vue";
import SuccessesErrors from "../../components/Success-N-Error.vue";
import Signup from "../../components/Signup.vue";
import {
	ServerIcon,
	CodeIcon,
	ShieldCheckIcon,
	GlobeAltIcon,
} from "@heroicons/vue/solid";

const width = ref(window.innerWidth);

onMounted(() => {
	window.addEventListener("resize", () => {
		width.value = window.innerWidth;
	});
});

const sne = ref();
</script>
