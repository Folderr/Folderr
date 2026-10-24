<script setup lang="ts">
defineProps<{
	type?: string;
	buttonDisabled?: boolean;
	onClick: () => any;
	buttonTitle?: string;
}>();
</script>
<template>
	<button
		:title="buttonTitle"
		:disabled="buttonDisabled"
		:class="[
			{
				'text-secondary-text hover:cursor-not-allowed bg-disabled opacity-60':
					buttonDisabled,
				'hover:bg-brand-darkened bg-brand text-bg font-bold shadow-sm':
					(!type || type != 'red') && !buttonDisabled,
				'text-white hover:bg-red-700 bg-red-600 shadow-sm':
					type && type === 'red' && !buttonDisabled,
			},
		]"
		class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 active:scale-95"
		@click="onClick"
	>
		<slot></slot>
	</button>
</template>
