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
				'text-secondary-bg hover:cursor-not-allowed bg-disabled border-disabled':
					buttonDisabled,
				'hover:border-brand-darkened hover:bg-brand-darkened bg-brand border-brand':
					(!type || type != 'red') && !buttonDisabled,
				'text-text hover:bg-secondary-accent hover:border-secondary-accent':
					type && type === 'red' && !buttonDisabled,
				'bg-secondary-accent-dark border-secondary-accent':
					type && type === 'red' && !buttonDisabled,
				'text-secondary-bg':
					(!type || type != 'red') && !buttonDisabled,
			},
		]"
		class="px-2 rounded-sm p-1 border-2 font-semibold"
		@click="onClick"
	>
		<slot></slot>
	</button>
</template>
