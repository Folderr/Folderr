<template>
	<!-- fairly flexible modal -->
	<Dialog :open="hide" @close="cancel" class="bg-opacity-50 bg-black right-0 top-0 w-full z-40 h-[100%] fixed flex flex-col">
		<DialogPanel class="bg-bg w-4/5 sm:w-4/5 lg:w-2/5 justify-center m-auto p-10 rounded-md border-2 border-bg overflow-auto">
			<span class="float-right text-text hover:cursor-pointer hover:text-secondary-text" v-on:click="cancel()">&times;</span>
			<DialogTitle class="text-brand text-lg font-headline font-semibold">{{header}}</DialogTitle>
			<!-- Allow for completely custom warnings and other information -->
			<slot name="warning"></slot>
			<DialogDescription><slot></slot></DialogDescription>
			<!-- Allow for input, if needed -->
			<input v-if="showInput"
				:class="[
					{
						'focus:ring-brand': greenContinue,
						'focus:ring-secondary-accent': !greenContinue,
					}
				]"
				class="mt-4 border-none mb-4 bg-[#393939] text-text p-4 w-4/5 xl:w-full placeholder-secondary-text focus:outline-none focus:ring rounded-sm font-input"
				v-bind:placeholder="placeholder"
				v-bind:title="title"
				v-bind:type="type"
				v-model="inputText"
				v-on:keyup.enter="needInput || (needInput && inputText?.length > 0) ? cont(inputText) : false"
				>
			<div class="flex mt-5 m-auto justify-center">
				<FButton v-if="!noCancel" v-bind:onClick="cancel" title="Cancel" type="neutral" class="mr-4">Cancel</FButton>
				<!-- "What color would you like your confirm button sir? We have green or red." -->
				<!-- inputText is sent here so it doesn't need to be a prop. -->
				<FButton
					v-bind:buttonDisabled="needInput ? !(inputText?.length > 0) : false"
					v-bind:onClick="() => cont(inputText)"
					v-bind:type="!greenContinue ? 'red' : undefined" class="ml-5"
					v-bind:colorDisabled="needInput ? !(inputText?.length > 0) : false"
				>{{ continueText }}</FButton>
			</div>
		</DialogPanel>
	</Dialog>
</template>

<script setup lang="ts">
import {ref} from "vue"
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    DialogDescription,
} from '@headlessui/vue'

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
	showInput: boolean
	needInput?: boolean;
	type?: string;
	title?: string;
	placeholder?: string;
}

withDefaults(defineProps<Props>(), {
	continueText: 'Continue',
	greenContinue: false,
	showInput: false,
	needInput: false,
	type: 'text',
	noCancel: false
});

const inputText = ref<string>('');
</script>