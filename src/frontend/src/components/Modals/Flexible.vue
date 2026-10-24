<template>
	<!-- Monstrous yet fairly flexible modal -->
	<Dialog :open="hide" @close="cancel" class="bg-black/60 backdrop-blur-sm right-0 top-0 w-full z-40 h-[100%] fixed flex flex-col p-4">
		<DialogPanel class="bg-[#242424] border border-[#3e3e3e] shadow-2xl sm:w-4/5 lg:w-2/5 justify-center m-auto p-8 rounded-2xl overflow-auto text-text">
			<button class="float-right text-secondary-text hover:text-text text-xl font-bold transition leading-none" @click="cancel()">&times;</button>
			<DialogTitle class="text-brand text-xl font-bold mb-2">{{header}}</DialogTitle>
			<!-- Allow for completely custom warnings and other information -->
			<slot name="warning"></slot>
			<slot></slot>
			<!-- Allow for input, if needed -->
			<input v-if="showInput"
				:class="[
					{
						'focus:border-brand focus:ring-1 focus:ring-brand': greenContinue,
						'focus:border-secondary-accent focus:ring-1 focus:ring-secondary-accent': !greenContinue,
					}
				]"
				class="mt-4 mb-4 border border-[#383838] bg-[#181818] text-text p-3 w-full placeholder-secondary-text/60 focus:outline-none rounded-lg text-sm transition"
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
	showInput: false
	needInput?: boolean;
	type?: string;
	title?: string;
	placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
	continueText: 'Continue',
	greenContinue: false,
	showInput: false,
	needInput: false,
	type: 'text',
	noCancel: false
});

const inputText = ref<string>('');
</script>
