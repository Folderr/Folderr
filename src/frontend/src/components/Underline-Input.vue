<template>
	<input
        :value="modelValue"
		:disabled="disabled"
        class="
        	block font-input
            focus:outline-none border-0
            text-brand
            p-4 pl-0 w-full mb-1
            border-brand-darkened border-b-2
            placeholder-secondary-text bg-inherit
            hover:border-brand hover:placeholder-text
            focus:placeholder-secondary-text
        "
        :class="[
            {
                'focus:border-brand': correct ?? true,
                'focus:border-secondary-accent': slightlyIncorrect ?? false,
                'border-brand-darkened': correct ?? true,
                'border-secondary-accent-dark': incorrect ?? false,
                'hover:border-secondary-accent': incorrect ?? false,
                'text-secondary-accent': incorrect ?? false,
                'mb-4': bottomMargin,
                'cursor-wait': disabled ?? false
            }
        ]"
        @input="$emit('update:modelValue', $event.target?.value)"
        @keyup.enter="jump"
    >
</template>
<script setup lang="ts">
import { emit } from "process";

defineProps<{
	disabled?: boolean
	bottomMargin: boolean
	incorrect?: boolean
	slightlyIncorrect?: boolean
	correct?: boolean
	modelValue: string
	jump?: () => any
}>()
defineEmits(['update:modelValue'])
</script>