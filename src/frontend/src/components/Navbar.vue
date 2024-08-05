<template>
	<nav
		class="fixed md:relative flex flex-wrap items-center justify-between md:px-2 py-3 w-full bg-bg md:bg-transparent"
	>
		<div
			class="container pr-4 m-auto flex flex-wrap items-center justify-between"
		>
			<div
				class="w-full relative flex-row-reverse flex justify-between md:w-auto px-8 md:px-4 pl-0 lg:static md:block md:justify-start"
			>
				<router-link
					to="/"
					class="text-2xl font-bold leading-relaxed inline-block mr-0 md:py-2 whitespace-nowrap text-brand hover:text-opacity-75 md:px-0"
				>
					Folderr
				</router-link>
				<button
					class="ml-2 cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block md:hidden outline-none focus:outline-none hover:bg-tertiary-bg"
					@click="showMenu = !showMenu"
				>
					<span
						class="block relative w-6 h-px rounded-sm bg-brand"
					></span>
					<span
						class="block relative w-6 h-px rounded-sm mt-1 bg-brand"
					></span>
					<span
						class="block relative w-6 h-px rounded-sm mt-1 bg-brand"
					></span>
				</button>
			</div>
			<div
				v-bind:class="{ hidden: !showMenu, flex: showMenu }"
				class="bg-secondary-bg w-full ml-4 md:bg-transparent md:flex md:grow items-center text-secondary-text rounded-lg sm:w-auto"
			>
				<ul
					class="flex flex-col md:flex-row list-none md:ml-auto w-full sm:w-auto"
				>
					<li>
						<router-link
							to="/"
							class="px-6 md:px-3 py-2 mr-2 flex grow items-center w-full border-b-2 md:border-none border-brand-darkened hover:bg-black md:hover:bg-transparent text-md font-bold leading-snug hover:text-text rounded-t-md"
							:class="[
								{
									'text-text': url === '/',
									'hover:text-brand': url === '/',
								},
							]"
						>
							<QuestionMarkCircleIcon
								class="w-5 h-5 mr-2 text-inherit"
								aria-hidden="true"
							/>
							why folderr
						</router-link>
					</li>
					<li>
						<a
							href="https://github.com/Folderr/Folderr"
							class="px-6 md:px-3 py-2 mr-2 flex grow items-center w-full border-b-2 md:border-none border-brand-darkened hover:bg-black md:hover:bg-transparent text-md font-bold leading-snug hover:text-text"
						>
							<Icon :icon="github" height="20" class="mr-2" />
							learn more
						</a>
					</li>
					<li>
						<router-link
							to="/info"
							class="px-6 md:px-3 py-2 mr-2 flex grow items-center w-full border-b-2 md:border-none border-brand-darkened hover:bg-black md:hover:bg-transparent text-md font-bold leading-snug hover:text-text"
							:class="[
								{
									'text-text': url === '/info',
									'hover:text-brand': url === '/info',
								},
							]"
						>
							<InformationCircleIcon
								class="w-5 h-5 mr-2 text-inherit"
								aria-hidden="true"
							/>
							info
						</router-link>
					</li>
					<li v-if="!url || !['/', '/signup'].includes(url)">
						<a
							href="/#login"
							class="px-6 md:px-3 py-2 mr-2 flex grow items-center w-full hover:bg-black md:hover:bg-transparent text-md font-bold leading-snug hover:text-text rounded-b-md"
							:class="[
								{
									'text-text': url === '/#login',
									'hover:text-brand': url === '/#login',
								},
							]"
						>
							<ArrowNarrowRightIcon
								class="w-5 h-5 mr-2 text-inherit"
								aria-hidden="true"
							/>
							login / signup
						</a>
					</li>
				</ul>
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
	InformationCircleIcon,
	QuestionMarkCircleIcon,
	ArrowNarrowRightIcon,
} from "@heroicons/vue/solid";
import { Icon } from "@iconify/vue";
import github from "@iconify/icons-codicon/github-inverted";

const props = defineProps<{
	url?: "/" | "/info" | "/signup" | "/account/deny" | "/account/verify";
	width?: number;
}>();

const showMenu = ref(false);

console.log(props.url && ["/"].includes(props.url));

const toggleNavbar = () => {
	showMenu.value = !showMenu.value;
};
</script>
