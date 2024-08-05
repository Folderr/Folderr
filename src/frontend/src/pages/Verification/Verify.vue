<template>
	<div class="bg-bg h-full md:h-screen flex flex-col">
		<!-- Maybe different navbar here? Maybe just add login link? -->
		<FNavbar url="/verify" />
		<!--- TODO: Put Logic Here --->
		<div class="m-auto">
			<div v-if="loading">
				<!-- TODO: Replace with spinner -->
				<Spinner />
			</div>
			<div v-else-if="verificationSuccess">
				<svg
					class="m-auto w-20 h-20 mb-4"
					width="45"
					height="45"
					viewBox="0 0 45 45"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g clip-path="url(#clip0_2566_264)">
						<circle cx="22.5" cy="22.5" r="22.5" fill="#185D35" />
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M37.9649 11.6588C38.3888 12.0807 38.6269 12.6529 38.6269 13.2495C38.6269 13.8461 38.3888 14.4183 37.9649 14.8403L19.8762 32.8403C19.4522 33.2621 18.8772 33.499 18.2776 33.499C17.6781 33.499 17.1031 33.2621 16.679 32.8403L7.63471 23.8403C7.22284 23.4159 6.99493 22.8476 7.00009 22.2576C7.00524 21.6677 7.24303 21.1033 7.66226 20.6862C8.08148 20.269 8.64859 20.0324 9.24144 20.0273C9.83428 20.0221 10.4054 20.2489 10.8319 20.6588L18.2776 	28.068L34.7677 11.6588C35.1917 11.237 35.7667 11 36.3663 11C36.9659 11 37.5409 11.237 37.9649 11.6588Z"
							fill="#2ECC71"
						/>
					</g>
					<defs>
						<clipPath id="clip0_2566_264">
							<rect width="45" height="45" fill="white" />
						</clipPath>
					</defs>
				</svg>
				<h1 class="text-4xl text-brand font-bold">
					Successfully Verified Email
				</h1>
				<h2 class="text-2xl text-secondary-text w-fit m-auto">
					You may now
					<RouterLink to="/#login" class="text-brand underline"
						>log in</RouterLink
					>
				</h2>
			</div>
			<div v-else>
				<svg
					class="m-auto w-20 h-20 mb-4"
					width="45"
					height="45"
					viewBox="0 0 45 45"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<g clip-path="url(#clip0_2566_275)">
						<circle cx="22.5" cy="22.5" r="22.5" fill="#590015" />
						<path
							d="M12.0091 7.78C11.4607 7.26664 10.7354 6.98717 9.986 7.00045C9.23659 7.01374 8.52157 7.31875 7.99157 7.85122C7.46158 8.3837 7.15799 9.10206 7.14476 9.85498C7.13154 10.6079 7.40972 11.3366 7.92069 11.8875L18.4116 22.4275L7.92069 32.9675C7.63648 33.2336 7.40853 33.5544 7.25042 33.9109C7.09232 34.2674 7.0073 34.6523 7.00045 35.0425C6.9936 35.4327 7.06505 35.8203 7.21053 36.1822C7.35602 36.5441 7.57257 36.8728 7.84726 37.1488C8.12195 37.4248 8.44915 37.6423 8.80934 37.7885C9.16954 37.9347 9.55534 38.0064 9.94375 37.9995C10.3322 37.9927 10.7152 37.9073 11.07 37.7484C11.4249 37.5896 11.7442 37.3605 12.0091 37.075L22.5 26.535L32.9909 37.075C33.2558 37.3605 33.5751 37.5896 33.93 37.7484C34.2848 37.9073 34.6678 37.9927 35.0562 37.9995C35.4447 38.0064 35.8305 37.9347 36.1907 37.7885C36.5509 37.6423 36.878 37.4248 37.1527 37.1488C37.4274 36.8728 37.644 36.5441 37.7895 36.1822C37.935 35.8203 38.0064 35.4327 37.9995 35.0425C37.9927 34.6523 37.9077 34.2674 37.7496 33.9109C37.5915 33.5544 37.3635 33.2336 37.0793 32.9675L26.5884 22.4275L37.0793 11.8875C37.5903 11.3366 37.8685 10.6079 37.8552 9.85498C37.842 9.10206 37.5384 8.3837 37.0084 7.85122C36.4784 7.31875 35.7634 7.01374 35.014 7.00045C34.2646 6.98717 33.5393 7.26664 32.9909 7.78L22.5 18.32L12.0091 7.78Z"
							fill="#A91F40"
						/>
					</g>
					<defs>
						<clipPath id="clip0_2566_275">
							<rect width="45" height="45" fill="white" />
						</clipPath>
					</defs>
				</svg>

				<h1 class="text-4xl text-secondary-accent font-bold">
					Failed to verify your account
				</h1>
				<h2 class="text-2xl text-secondary-text m-auto w-fit">
					{{ altMessage ? altMessage : error }}
				</h2>
			</div>
		</div>

		<FFooter />
	</div>
</template>

<script setup lang="ts">
import Spinner from "../../components/Spinner.vue";
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
	// Verify Plz
	if (
		!route.params.token ||
		!route.params.userid ||
		Array.isArray(route.params.userid) ||
		Array.isArray(route.params.token)
	)
		return;

	const fuckyou = await sdk.Verification.self.verifySelf(
		route.params.userid,
		route.params.token
	);
	if (fuckyou.error) {
		if (fuckyou.error instanceof Error) {
			error.value = fuckyou.error.message;
			errorCause.value = fuckyou.error.cause;
		} else {
			error.value = fuckyou.error;
		}
	} else if (fuckyou.success) {
		verificationSuccess.value = true;
	} else {
		altMessage.value = "Something went wrong and I don't know what.";
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
	// do verification thingy
});
</script>
