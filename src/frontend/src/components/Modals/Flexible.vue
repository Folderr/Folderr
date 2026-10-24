<template>
	<!-- Monstrous yet fairly flexible modal -->
	<Dialog
		:open="hide"
		@close="cancel"
		class="bg-black/50 right-0 top-0 w-full z-40 h-full fixed flex flex-col"
	>
		<DialogPanel
			class="bg-bg sm:w-4/5 lg:w-2/5 justify-center m-auto p-10 rounded-md border-2 border-bg overflow-auto"
		>
			<button
				type="button"
				aria-label="Close"
				class="float-right text-text hover:cursor-pointer hover:text-secondary-text"
				@click="cancel()"
			>
				&times;
			</button>
			<DialogTitle class="text-brand text-lg">{{ header }}</DialogTitle>
			<!-- Allow for completely custom warnings and other information -->
			<slot name="warning"></slot>
			<slot></slot>
			<!-- Allow for input, if needed -->
			<input
				v-if="showInput"
				:class="[
					{
						'focus:ring-brand': greenContinue,
						'focus:ring-secondary-accent': !greenContinue,
					},
				]"
				class="mt-4 mb-4 border-none bg-tertiary-bg text-text p-4 w-4/5 xl:w-full placeholder-secondary-text focus:outline-hidden focus:ring-3 rounded-xs"
				:placeholder="placeholder"
				:title="title"
				:type="type"
				v-model="inputText"
				@keyup.enter="
					needInput || (needInput && inputText?.length > 0)
						? cont(inputText)
						: false
				"
			/>
			<div class="flex mt-5 m-auto justify-center">
				<FButton
					v-if="!noCancel"
					:on-click="cancel"
					title="Cancel"
					type="neutral"
					class="mr-4"
					>Cancel</FButton
				>
				<!-- "What color would you like your confirm button sir? We have green or red." -->
				<!-- inputText is sent here so it doesn't need to be a prop. -->
				<FButton
					:button-disabled="
						needInput ? !(inputText?.length > 0) : false
					"
					:on-click="() => cont(inputText)"
					:type="!greenContinue ? 'red' : undefined"
					class="ml-5"
					:color-disabled="
						needInput ? !(inputText?.length > 0) : false
					"
					>{{
						continueText
					}}</FButton
				>
			</div>
		</DialogPanel>
	</Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { ref } from "vue";

interface Props {
	header: string;
	hide: boolean;
	cancel: () => any;
	noCancel?: boolean;

	// Related to the continue button
	cont: (input?: string) => any;
	continueText?: string;
	greenContinue?: boolean;

	// Related to the input box
	showInput: false;
	needInput?: boolean;
	type?: string;
	title?: string;
	placeholder?: string;
}

withDefaults(defineProps<Props>(), {
	continueText: "Continue",
	greenContinue: false,
	showInput: false,
	needInput: false,
	type: "text",
	noCancel: false,
});

const inputText = ref<string>("");
</script>
