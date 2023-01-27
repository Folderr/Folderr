<script setup lang="ts">
const props = defineProps<{
	type?: string;
	colorDisabled?: boolean;
	buttonDisabled?: boolean;
	onClick: () => any;
	buttonTitle?: string;
}>()
</script>
<template>
	<button v-if="!type || type === 'neutral'" v-bind:title='buttonTitle' v-bind:disabled="buttonDisabled" @click="onClick()" :class="[
        {
            'hover:cursor-not-allowed': colorDisabled,
            'bg-disabled': colorDisabled,
            'border-disabled': colorDisabled,
            'border-brand-darkened': !colorDisabled,
            'bg-brand-darkened': !colorDisabled
            },
    ]" class="px-8 rounded-sm p-2 border-2 text-text font-semibold">
		<slot></slot>
	</button>
	<button v-else v-bind:disabled="buttonDisabled" @click="onClick" :class="[
        {
        	'text-text': !colorDisabled,
            'text-secondary-text': colorDisabled,
            'hover:cursor-not-allowed': colorDisabled,
            'bg-disabled': colorDisabled,
            'border-disabled': colorDisabled,
            'border-secondary-accent': !colorDisabled,
            'bg-secondary-accent': !colorDisabled
            },
    ]" class="px-8 rounded-sm p-2 border-2 mt-2 font-semibold">
		<slot></slot>
	</button>
</template>