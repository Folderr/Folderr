<template>
	<!-- Monstrous yet fairly flexible modal -->
	<div v-show="hide" class="bg-opacity-50 bg-black right-0 top-0 w-full z-10 h-[100%] fixed flex flex-col">
		<div class="bg-bg w-3/5 justify-center m-auto p-10 rounded-sm border-2 border-bg overflow-auto">
			<span class="float-right text-text hover:cursor-pointer hover:text-secondary-text" v-on:click="cancel()">&times;</span>
			<h1 class="text-brand text-lg">{{header}}</h1>
			<!-- Allow for completely custom warnings and other information -->
			<slot name="warning"></slot>
			<slot></slot>
			<!-- Allow for input, if needed -->
			<input v-if="showInput"
				:class="[
					'mt-2',
					'mb-4',
					'bg-[#393939]',
					'text-text',
					'p-4',
					'w-[200px]',
					'xl:w-2/5',
					'placeholder-secondary-text',
					'focus:outline-none',
					'focus:ring',
					{
						'focus:ring-brand': greenContinue,
						'focus:ring-secondary-accent': !greenContinue,
					}
				]"
				v-bind:placeholder="placeholder"
				v-bind:title="title"
				v-bind:type="type"
				v-model="inputText">
			<div class="flex mt-10 m-auto justify-center">
				<button v-if="!noCancel" v-on:click="cancel()" class="mr-5 text-text px-5 py-2 border-2 border-text rounded-md">Cancel</button>
				<!-- "What color would you like your confirm button sir? We have green or red." -->
				<!-- inputText is sent here so it doesn't need to be a prop. -->
				<button v-bind:disabled="needInput ? !(inputText?.length > 0) : false" v-on:click="cont(inputText)" :class="[
					'ml-5',
					'px-5',
					'py-2',
					'border-2',
					{
						'border-secondary-accent': !greenContinue,
						'text-secondary-accent': !greenContinue,
						'border-brand': greenContinue,
						'text-brand': greenContinue,
						'hover:cursor-not-allowed': needInput ? !(inputText?.length) : false,
						'opacity-80': showInput && needInput ? !(inputText?.length) : false,
					},
					'rounded-md']">{{ continueText }}</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {ref, PropType} from "vue"

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
