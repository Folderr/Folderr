<template>
	<div class="bg-bg min-h-screen flex flex-col text-text">
		<FNavbar url="/signup/success" />

		<main class="container mx-auto px-4 py-16 grow flex flex-col items-center justify-center max-w-xl text-center">
			<div class="bg-tertiary-bg/70 border border-[#383838] rounded-2xl p-8 sm:p-10 shadow-xl flex flex-col items-center w-full">
				<div v-if="signupType === 'Undetermined' && err.length === 0" class="py-8">
					<Spinner />
					<p class="text-secondary-text text-sm mt-4">Confirming account status...</p>
				</div>

				<div v-else-if="err.length > 0 || signupType === 'Closed'" class="flex flex-col items-center">
					<div class="w-16 h-16 rounded-2xl bg-red-600/15 text-red-400 flex items-center justify-center mb-5">
						<XCircleIcon class="w-10 h-10" />
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-red-400 tracking-tight mb-2">
						{{ err.length > 0 ? "Signup Processing Issue" : "Signups Are Closed" }}
					</h1>
					<p class="text-secondary-text text-sm mb-6">
						{{ err.length > 0 ? err : "This instance is currently not accepting new public registrations." }}
					</p>
					<router-link
						to="/"
						class="px-6 py-2.5 rounded-lg bg-tertiary-bg hover:bg-[#383838] text-text border border-[#3e3e3e] font-semibold text-sm transition"
					>
						Return Home
					</router-link>
				</div>

				<div v-else class="flex flex-col items-center">
					<div class="w-16 h-16 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mb-5">
						<CheckCircleIcon class="w-10 h-10" />
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-brand tracking-tight mb-2">
						Registration Received!
					</h1>
					<p v-if="signupType === 'Admin'" class="text-secondary-text text-sm mb-6">
						Your account request has been submitted. An administrator will review and verify your access.
					</p>
					<p v-else-if="signupType === 'Email'" class="text-secondary-text text-sm mb-6">
						We sent a verification link to your email address. Please click the link to activate your account (be sure to check your spam folder).
					</p>

					<router-link
						to="/#login"
						class="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition"
					>
						Back to Login
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
import * as API from "fldrr-web-sdk";
import { onMounted, ref, type Ref } from "vue";

const api = API.setup();

type SignupType = "Admin" | "Email" | "Closed" | "Undetermined";
const signupType: Ref<SignupType> = ref("Undetermined");

const err = ref("");
const errCause = ref("");

async function getSetSignupType() {
	const out = await api.Public.info.getApiInfo();

	if (!out.output || out.error) {
		if (out.error && out.error instanceof Error) {
			err.value = out.error.message;
			errCause.value =
				typeof out.error.cause === "string" ? out.error.cause : "";
			return;
		}

		err.value = "Unknown error occurred.";
		return;
	}

	if (typeof out.output !== "string") {
		switch (out.output.features.signups) {
			case 0: {
				signupType.value = "Closed";
				break;
			}

			case 1: {
				signupType.value = "Admin";
				break;
			}

			case 2: {
				if (out.output.features.emailer) {
					signupType.value = "Email";
					break;
				}

				signupType.value = "Closed";
				break;
			}

			default: {
				err.value = "Impossible response given by server";
			}
		}
	}
}

onMounted(async () => {
	await getSetSignupType();
});
</script>
