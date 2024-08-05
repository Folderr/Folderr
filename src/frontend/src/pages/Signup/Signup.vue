<template>
	<div class="bg-bg h-full md:h-screen flex flex-col">
		<FNavbar url="/" :width="width" />
		<SuccessesErrors ref="sne" />
		<div class="flex flex-col md:flex-row">
			<div
				id="hero"
				class="md:ml-32 mt-24 md:mt-20 flex flex-col md:w-[40%] ml-8"
			>
				<!-- eslint-disable max-len -->
				<h1
					class="text-text text-3xl md:text-5xl font-bold underline decoration-brand underline-offset-4 decoration-6 font-headline"
				>
					<!-- eslint-enable max-len -->
					Folderr
				</h1>
				<p class="text-secondary-text text-md my-2 font-info">
					easy to use and powerful link shortener and file host
				</p>
				<!-- eslint-disable max-len -->
				<a
					class="flex justify-center content-center my-5 mt-3 md:mt-7 bg-white px-10 py-3 md:py-5 w-max rounded-md font-semibold text-lg"
					href="https://github.com/Folderr/Folderr"
				>
					<!-- eslint-enable max-len -->
					<Icon
						:icon="github"
						color="#131313"
						height="30"
						class="mr-4"
					/>learn more on GitHub
				</a>
				<div
					class="my-5 grid sm:grid-rows-2 sm:grid-cols-2 gap-4 md:gap-6"
				>
					<div>
						<h1
							class="text-text text-2xl md:text-3xl font-semibold font-headline"
						>
							Self-Hostable
						</h1>
						<p
							class="text-secondary-text text-md md:text-lg mt-2 font-info"
						>
							easily host on any platform.
						</p>
					</div>
					<div>
						<h1
							class="text-text text-2xl md:text-3xl font-semibold font-headline"
						>
							Open Source
						</h1>
						<p
							class="text-secondary-text text-md md:text-lg mt-2 font-info"
						>
							developers are able to verify code integrity and
							security at any time.
						</p>
					</div>
					<div>
						<h1
							class="text-text text-2xl md:text-3xl font-semibold font-headline"
						>
							Unbiased
						</h1>
						<p
							class="text-secondary-text text-md md:text-lg mt-2 font-info"
						>
							Folderr doesn’t care who you are or what you do
							outside of it.
						</p>
					</div>
					<div>
						<h1
							class="text-text text-2xl md:text-3xl font-semibold font-headline"
						>
							For the User
						</h1>
						<p
							class="text-secondary-text text-md md:text-lg mt-2 font-info"
						>
							designed to allow users to use their own domains, on
							any instance.
						</p>
					</div>
				</div>
			</div>
			<!-- eslint-disable max-len -->
			<div
				id="signup"
				class="m-auto bg-bg-old rounded-lg border-2 mt-8 md:mt-28 border-bg-old px-14 p-14 content-center justify-center"
			>
				<!-- eslint-enable max-len -->
				<Signup :sne="sne" />
				<div class="flex mt-2 justify-center w-[100%] font-headline">
					<p class="text-secondary-text">returning user?</p>
					<a
						class="border-0 bg-transparent text-brand ml-2 hover:font-bold"
						href="/#login"
						>Login</a
					>
				</div>
			</div>
		</div>
		<FFooter />
	</div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import github from "@iconify/icons-codicon/github-inverted";
import { ref, onMounted } from "vue";
import SuccessesErrors from "../components/Success-N-Error.vue";
import * as API from "fldrr-web-sdk";
import Signup from "../components/Signup.vue";

const width = ref(window.innerWidth);

onMounted(() => {
	window.addEventListener("resize", () => {
		width.value = window.innerWidth;
	});
});

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments, @typescript-eslint/no-redundant-type-constituents
const sne = ref();
</script>
