<script setup lang="ts">
import { CheckCircleIcon, UserAddIcon } from "@heroicons/vue/solid";
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
		<h1 class="text-text text-3xl mb-1 font-headline">sign up</h1>
		<p class="text-secondary-text mb-4 font-headline">welcome to Folderr</p>
		<label for="username" class="block text-text font-info">username</label>
		<UInput
			v-model="username"
			placeholder="your username"
			pattern="[a-z0-9_]{3,16}"
			:disabled="loading"
			required
			:bottom-margin="username.length === 0 || isAllValid"
			:correct="isUsernameValid"
			:slightly-incorrect="!isUsernameValid"
			:incorrect="username.length > 0 && !isUsernameValid"
			autocomplete="username"
			@keyup.enter="jumpToEmail()"
		/>
		<p
			v-if="username.length > 0 && !isUsernameValid && !isAllValid"
			class="text-secondary-accent mb-4"
		>
			Invalid Username
		</p>
		<p v-if="isUsernameValid && !isAllValid" class="text-brand mb-4">
			Valid Username
		</p>
		<label for="identify" class="block text-text font-info">email</label>
		<UInput
			id="identify"
			ref="emailEl"
			v-model="email"
			placeholder="your email"
			required
			:correct="isEmailValid"
			:incorrect="email.length > 0 && !isEmailValid"
			:slightly-incorrect="!isEmailValid"
			:disabled="loading"
			:bottom-margin="email.length === 0 || isAllValid"
			@keyup.enter="jumpToPassword()"
		/>
		<p
			v-if="email.length > 0 && !isEmailValid && !isAllValid"
			class="text-secondary-accent mb-4"
		>
			Invalid Email
		</p>
		<p v-if="isEmailValid && !isAllValid" class="text-brand mb-4">
			Valid Email
		</p>
		<label for="password" class="block text-text font-info justify-center"
			>password</label
		>
		<UInput
			id="password"
			ref="passw"
			v-model="password"
			required
			placeholder="your password"
			type="password"
			autocomplete="password"
			:disabled="loading"
			:incorrect="password.length > 0 && !isPasswordValid"
			:slightly-incorrect="!isPasswordValid"
			:correct="isPasswordValid"
			:bottom-margin="password.length === 0 || isAllValid"
			@keyup.enter="jumpToRetype()"
		/>
		<p
			v-if="password.length > 0 && !isPasswordValid && !isAllValid"
			class="text-secondary-accent mb-4"
		>
			Invalid Password
		</p>
		<p v-if="isPasswordValid && !isAllValid" class="text-brand mb-4">
			Valid Password
		</p>
		<label
			for="retype-password"
			class="block text-text font-info justify-center"
			>re-type password</label
		>
		<UInput
			id="retype-password"
			ref="passw2"
			v-model="repasswd"
			type="password"
			required
			placeholder="your password again"
			autocomplete="password"
			:incorrect="repasswd.length > 0 && !isRePasswordValid"
			:slightly-incorrect="!isRePasswordValid"
			:correct="isRePasswordValid"
			:bottom-margin="repasswd.length === 0"
			:disabled="loading"
			@keyup.enter="jumpToLogin()"
		/>
		<p
			v-if="repasswd.length > 0 && !isRePasswordValid && !isAllValid"
			class="text-secondary-accent mb-4"
		>
			Invalid Password
		</p>
		<p v-if="isRePasswordValid && !isAllValid" class="text-brand mb-4">
			Valid Password
		</p>
		<p v-if="isAllValid" class="text-brand mb-4">All items are valid</p>
		<!-- eslint-disable max-len -->
		<button
			ref="signupBtn"
			:disabled="loading"
			class="flex justify-center font-info font-extrabold text-bg-old bg-brand border-2 p-4 border-brand hover:bg-brand-darkened hover:border-brand-darkened rounded-lg w-full xl:w-80"
			:class="[
				{
					'bg-disabled': loading,
					'border-disabled': loading,
					'cursor-wait': loading,
					'hover:bg-disabled': loading,
					'hover:border-disabled': loading,
				},
			]"
			@click="signup()"
		>
			<!-- eslint-enable max-len -->
			<UserAddIcon
				v-if="!loading"
				class="w-5 my-auto mr-2"
			/><CheckCircleIcon v-else class="w-5 my-auto mr-2" />{{
				loading ? "Signing Up" : "Sign Up"
			}}
		</button>
	</div>
</template>
