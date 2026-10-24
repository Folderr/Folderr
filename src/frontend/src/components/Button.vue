<script setup lang="ts">
defineProps<{
	type?: string;
	colorDisabled?: boolean;
	buttonDisabled?: boolean;
	onClick: () => any;
	buttonTitle?: string;
}>()
</script>
<template>
	<button
		v-if="!type"
		:title="buttonTitle"
		:disabled="buttonDisabled"
		:class="[
			{
				'hover:cursor-not-allowed opacity-60 bg-disabled text-secondary-text': colorDisabled || buttonDisabled,
				'hover:bg-brand-darkened bg-brand text-bg font-bold shadow-md hover:shadow-lg': !colorDisabled && !buttonDisabled,
			},
		]"
		class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-95"
		@click="onClick"
	>
		<slot></slot>
	</button>
	<button
		v-else-if="type === 'neutral'"
		:title="buttonTitle"
		:disabled="buttonDisabled"
		:class="[
			{
				'hover:cursor-not-allowed opacity-60 bg-disabled text-secondary-text': colorDisabled || buttonDisabled,
				'hover:bg-[#383838] bg-[#2a2a2a] text-text border border-[#3e3e3e] shadow-sm': !colorDisabled && !buttonDisabled,
			},
		]"
		class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-95"
		@click="onClick"
	>
		<slot></slot>
	</button>
	<button
		v-else
		:title="buttonTitle"
		:disabled="buttonDisabled"
		:class="[
			{
				'hover:cursor-not-allowed opacity-60 bg-disabled-red text-secondary-text': colorDisabled || buttonDisabled,
				'hover:bg-red-700 bg-red-600 text-white shadow-md': !colorDisabled && !buttonDisabled,
			},
		]"
		class="px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-95"
		@click="onClick"
	>
		<slot></slot>
	</button>
</template>