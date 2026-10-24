<script setup lang="ts">
import { CheckCircleIcon, UserAddIcon } from "@heroicons/vue/solid";
import Spinner from "./Spinner.vue";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import * as api from "../wrappers/api.js";
import type SuccessesErrors from "../components/Success-N-Error.vue";
import UInput from "./Underline-Input.vue";
import { passwordRegex, usernameRegex, emailRegex } from "../utils/regexs";

// Initialize refs for the actual logging in.
const username = ref("");
const password = ref("");
const email = ref("");
const repasswd = ref("");
const loading = ref(false);
const signups = ref(false);

const props = defineProps<{
	sne?: InstanceType<typeof SuccessesErrors> & {
		addError: (messaage: string, time?: number) => void;
		addSuccess: (message: string, time?: number) => void;
	};
}>();

// Initialize refs
const passw = ref();
const signupBtn = ref<HTMLButtonElement>();
const emailEl = ref();
const passw2 = ref();
const router = useRouter();

const signup = async () => {
	if (loading.value) {
		// Can't sign up if the page is loading!
		return;
	}

	// Ensure the username & password are present.
	const missing = [];
	if (!username.value) {
		missing.push("username");
	}

	if (!password.value) {
		missing.push("password");
	}

	if (!email.value) {
		missing.push("email");
	}

	if (!repasswd.value) {
		missing.push("retyped password");
	}

	if (missing.length > 0) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		props.sne?.addError(`Error: Missing ${missing.join(" & ")}`);
		return;
	}

	if (repasswd.value !== password.value) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		props.sne?.addError("Need passwords to be the same");
		return;
	}

	if (!usernameRegex.test(username.value)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		props.sne?.addError("Username not valid");
		return;
	}

	if (!passwordRegex.test(password.value)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		props.sne?.addError("Password not valid");
	}

	loading.value = true;
	const output = await api.signup(
		username.value,
		password.value,
		email.value
	);
	if (output.error) {
		// Oh no, login failed.
		if (typeof output.error === "string") {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			props.sne?.addError(output.error);
		}

		loading.value = false;
		return;
	}

	if (output.success) {
		// If we signed up, go to the congrats page.
		return router.push("/signup/success");
	}
};

const jumpToPassword = () => {
	// Focuses to the password input
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	passw.value?.$el.focus();
};

const jumpToEmail = () => {
	// Focuses to the password input
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	emailEl.value?.$el?.focus();
};

const jumpToRetype = () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	passw2.value?.$el?.focus();
};

const jumpToLogin = () => {
	// Focuses on the login button
	signupBtn.value?.click();
};

const isUsernameValid = computed(() => {
	if (username.value.length === 0) return false;
	return usernameRegex.test(username.value);
});

const isEmailValid = computed(() => {
	if (email.value.length === 0) return false;
	return emailRegex.test(email.value);
});

const isPasswordValid = computed(() => {
	if (password.value.length === 0) return false;
	return passwordRegex.test(password.value);
});

const isRePasswordValid = computed(() => {
	if (repasswd.value.length === 0) return false;
	if (repasswd.value !== password.value) return false;
	return passwordRegex.test(repasswd.value);
});

const isAllValid = computed(() => {
	if (
		isRePasswordValid.value &&
		isPasswordValid.value &&
		isEmailValid.value &&
		isUsernameValid.value
	) {
		return true;
	}

	return false;
});
</script>

<template>
	<div>
		<h2 class="text-2xl font-extrabold text-text mb-1 tracking-tight font-headline">Create Account</h2>
		<p class="text-secondary-text text-xs mb-6">Get started with your personal Folderr account</p>

		<div class="space-y-4">
			<div>
				<label for="username" class="block text-xs font-semibold text-secondary-text mb-1.5">Username</label>
				<UInput
					id="username"
					v-model="username"
					placeholder="Choose a username"
					pattern="[a-z0-9_]{3,16}"
					:disabled="loading"
					required
					:bottom-margin="false"
					:correct="isUsernameValid"
					:slightly-incorrect="!isUsernameValid"
					:incorrect="username.length > 0 && !isUsernameValid"
					autocomplete="username"
					@keyup.enter="jumpToEmail()"
				/>
				<p
					v-if="username.length > 0 && !isUsernameValid && !isAllValid"
					class="text-xs text-secondary-accent mt-1"
				>
					Username must be 3-16 characters (letters, numbers, underscore)
				</p>
			</div>

			<div>
				<label for="identify" class="block text-xs font-semibold text-secondary-text mb-1.5">Email Address</label>
				<UInput
					id="identify"
					ref="emailEl"
					v-model="email"
					placeholder="Enter your email"
					required
					:correct="isEmailValid"
					:incorrect="email.length > 0 && !isEmailValid"
					:slightly-incorrect="!isEmailValid"
					:disabled="loading"
					:bottom-margin="false"
					@keyup.enter="jumpToPassword()"
				/>
				<p
					v-if="email.length > 0 && !isEmailValid && !isAllValid"
					class="text-xs text-secondary-accent mt-1"
				>
					Please enter a valid email address
				</p>
			</div>

			<div>
				<label for="password" class="block text-xs font-semibold text-secondary-text mb-1.5">Password</label>
				<UInput
					id="password"
					ref="passw"
					v-model="password"
					required
					placeholder="Create a strong password"
					type="password"
					autocomplete="new-password"
					:disabled="loading"
					:incorrect="password.length > 0 && !isPasswordValid"
					:slightly-incorrect="!isPasswordValid"
					:correct="isPasswordValid"
					:bottom-margin="false"
					@keyup.enter="jumpToRetype()"
				/>
				<p
					v-if="password.length > 0 && !isPasswordValid && !isAllValid"
					class="text-xs text-secondary-accent mt-1"
				>
					Password must be at least 8 characters
				</p>
			</div>

			<div>
				<label for="retype-password" class="block text-xs font-semibold text-secondary-text mb-1.5">Confirm Password</label>
				<UInput
					id="retype-password"
					ref="passw2"
					v-model="repasswd"
					type="password"
					required
					placeholder="Confirm your password"
					autocomplete="new-password"
					:incorrect="repasswd.length > 0 && !isRePasswordValid"
					:slightly-incorrect="!isRePasswordValid"
					:correct="isRePasswordValid"
					:bottom-margin="false"
					:disabled="loading"
					@keyup.enter="signup()"
				/>
				<p
					v-if="repasswd.length > 0 && !isRePasswordValid && !isAllValid"
					class="text-xs text-secondary-accent mt-1"
				>
					Passwords do not match
				</p>
			</div>

			<button
				ref="signupBtn"
				type="button"
				:disabled="loading"
				class="w-full py-3 px-6 rounded-xl bg-brand hover:bg-brand-darkened text-bg font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
				@click="signup()"
			>
				<Spinner v-if="loading" class="w-4 h-4 text-bg" />
				<UserAddIcon v-else class="w-4 h-4" />
				<span>{{ loading ? "Creating Account..." : "Sign Up" }}</span>
			</button>
		</div>
	</div>
</template>
