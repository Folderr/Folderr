<template>
	<div class="bg-bg min-h-screen flex flex-col text-text">
		<FNavbar url="/account/verify" />

		<main class="container mx-auto px-4 py-16 grow flex flex-col items-center justify-center max-w-xl text-center">
			<div class="bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-8 sm:p-10 shadow-xl flex flex-col items-center w-full">
				<div v-if="loading" class="py-8">
					<Spinner />
					<p class="text-secondary-text text-sm mt-4">Verifying your account credentials...</p>
				</div>

				<div v-else-if="verificationSuccess" class="flex flex-col items-center">
					<div class="w-16 h-16 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mb-5">
						<CheckCircleIcon class="w-10 h-10" />
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-brand tracking-tight mb-2">
						Email Verified Successfully
					</h1>
					<p class="text-secondary-text text-sm mb-6">
						Your email address has been verified. You can now log in to your account.
					</p>
					<router-link
						to="/#login"
						class="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition"
					>
						Go to Login
					</router-link>
				</div>

				<div v-else class="flex flex-col items-center">
					<div class="w-16 h-16 rounded-2xl bg-red-600/15 text-red-400 flex items-center justify-center mb-5">
						<XCircleIcon class="w-10 h-10" />
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-red-400 tracking-tight mb-2">
						Verification Failed
					</h1>
					<p class="text-secondary-text text-sm mb-6">
						{{ altMessage ? altMessage : (error || "Unable to complete verification.") }}
					</p>
					<router-link
						to="/"
						class="px-6 py-2.5 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-text border border-[#3e3e3e] font-semibold text-sm transition"
					>
						Return Home
					</router-link>
				</div>
			</div>
		</main>

		<FFooter />
	</div>
</template>

<script setup lang="ts">
import Spinner from "../../components/Spinner.vue";
import FNavbar from "../../components/Navbar.vue";
import FFooter from "../../components/Footer.vue";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/solid";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as FolderrSDK from "fldrr-web-sdk";

const sdk = FolderrSDK.setup();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const verificationSuccess = ref(false);
const altMessage = ref("");
const error = ref("");
const errorCause = ref();

const verifyAccount = async () => {
	if (
		!route.params.token ||
		!route.params.userid ||
		Array.isArray(route.params.userid) ||
		Array.isArray(route.params.token)
	)
		return;

	const verification = await sdk.Verification.self.verifySelf(
		route.params.userid,
		route.params.token
	);
	if (verification.error) {
		if (verification.error instanceof Error) {
			error.value = verification.error.message;
			errorCause.value = verification.error.cause;
		} else {
			error.value = verification.error;
		}
	} else if (verification.success) {
		verificationSuccess.value = true;
	} else {
		altMessage.value = "Something went wrong during verification.";
	}

	loading.value = false;
};

onMounted(async () => {
	if (
		!route.params.token ||
		!route.params.userid ||
		Array.isArray(route.params.userid) ||
		Array.isArray(route.params.token)
	) {
		altMessage.value = "Invalid ID or Verification Token Provided";
		loading.value = false;
		return;
	}

	await verifyAccount();
});
</script>
