<template>
    <div v-if="successes.length || errors.length" class="mt-4 z-50 fixed right-4 top-20">
        <div v-for="success of successes" v-bind:key="success">
            <div :class="[
                'justify-center',
                'bg-brand-darkened',
                'text-white',
                'p-4',
                'text-center',
                'flex',
                'm-auto',
                'w-max',
                'px-8',
                {
                    'mt-2': successes.length > 0
                },
                'rounded-lg',
                'border-brand-darkened'
            ]">
                <p>{{success}}</p>
                <button @click="removeSuccess(getSuccessIndex(success))" class="bg-none border-none text-black ml-4">X</button>
            </div>
        </div>
        <div v-for="error of errors" v-bind:key="error">
            <div :class="[
                'justify-center',
                'bg-secondary-accent',
                'text-white',
                'p-4',
                'text-center',
                'flex',
                'm-auto',
                'w-max',
                'px-8',
                {
                    'mt-2': successes.length > 0 || errors.length > 1
                },
                'rounded-lg',
                'border-secondary-accent'
            ]">
                <p>{{error}}</p>
                <button @click="removeError(getErrorIndex(error))" class="bg-none border-none text-black ml-4">X</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';

const successes = ref<string[]>([]);

/**
 * Adds a success to the list
 * 
 * @param {String} message The message to show the user
 * @param {Number} [time=3000] The time in milliseconds the success will stay up.
 */
const addSuccess = (message: string, time?: number) => { // Add a success to the list
    successes.value.push(message);
    setTimeout(() => {
        removeSuccess(successes.value.indexOf(message));
    }, time || 3000);
}

/**
 * Get the index of a success
 * 
 * @param {String} message The message to retrieve the success with
 */
const getSuccessIndex = (message: string): number => {
    return successes.value.indexOf(message);
}

/**
 * Remove an error from the list of successs
 * 
 * @param {Number} index The index of the success to remove
 */
const removeSuccess = (index: number): void => {
    successes.value.splice(index);
}

const errors = ref<string[]>([])

/**
 * Adds a error to the list
 * 
 * @param {String} message The message to show the user
 * @param {Number} [time=3000] The time in milliseconds the message will stay up.
 */
const addError = (message: string, time?: number): void => {
    errors.value.push(message);
    setTimeout(() => {
        removeError(errors.value.indexOf(message));
    }, time || 3000);
}

/**
 * Get the index of a success
 * 
 * @param {String} message The message to retrieve the success with
 */
const getErrorIndex = (message: string): number => {
    return errors.value.indexOf(message);
}

/**
 * Remove an error from the list of errors
 * 
 * @param {Number} index The index of the error to remove
 */
const removeError = (index: number): void => {
    errors.value.splice(index);
}

defineExpose<{
    addError: typeof addError,
    addSuccess: typeof addSuccess
}>({
    addError,
    addSuccess
})
</script>