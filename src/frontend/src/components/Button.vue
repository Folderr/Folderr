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
                :title='buttonTitle'
                :disabled="buttonDisabled"
                :class="[
                        {
                                'hover:cursor-not-allowed': colorDisabled,
                                'bg-disabled': colorDisabled,
                                'border-disabled': colorDisabled,
                                'hover:border-brand-darkened': !colorDisabled,
                                'hover:bg-brand-darkened': !colorDisabled,
                                'bg-brand': !colorDisabled,
                                'border-brand': !colorDisabled,
                                'text-text': colorDisabled,
                                'text-secondary-bg': !colorDisabled
                        },
                ]"
                class="px-8 rounded-sm p-2 border-2 font-semibold"
                @click="onClick"
        >
		<slot></slot>
	</button>
        <button
                v-else-if="type === 'neutral'"
                :title='buttonTitle'
                :disabled="buttonDisabled"
                :class="[
                        {
                                'hover:cursor-not-allowed': colorDisabled,
                                'bg-disabled': colorDisabled,
                                'border-disabled': colorDisabled,
                                'hover:border-secondary-text': !colorDisabled,
                                'hover:bg-secondary-text': !colorDisabled,
                                'bg-white': !colorDisabled,
                                'border-text': !colorDisabled,
                                'text-text': colorDisabled,
                                'text-black': !colorDisabled
                        },
                ]"
                class="px-8 rounded-sm p-2 border-2 font-semibold"
                @click="onClick"
        >
		<slot></slot>
	</button>
	<button
                v-else
                :disabled="buttonDisabled"
                :class="[
                        {
                                'hover:cursor-not-allowed': colorDisabled,
                                'bg-disabled-red': colorDisabled,
                                'border-disabled-red': colorDisabled,
                                'hover:border-secondary-accent': !colorDisabled,
                                'hover:bg-secondary-accent': !colorDisabled,
                                'border-secondary-accent-dark': !colorDisabled,
                                'bg-secondary-accent-dark': !colorDisabled,
                                'text-secondary-text': colorDisabled,
                                'text-text': !colorDisabled
                        },
                ]"
                class="px-8 rounded-sm p-2 border-2 font-semibold"
                @click="onClick"
        >
		<slot></slot>
	</button>
</template>