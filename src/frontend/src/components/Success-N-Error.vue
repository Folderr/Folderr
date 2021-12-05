<template>
    <div v-if="successes.length || errors.length" class="mt-4 z-10 fixed right-4 top-20">
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
                <button @click="removeSuccess(this.successes.indexOf(success))" class="bg-none border-none text-black ml-4">X</button>
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
                <button @click="removeError(this.errors.indexOf(error))" class="bg-none border-none text-black ml-4">X</button>
            </div>
        </div>
    </div>
</template>

<script>
import {defineComponent} from 'vue'
export default defineComponent({
    name: 'SuccessError',
    data() {
        return {
            successes: [],
            errors: []
        }
    },
    methods: {
        addSuccess: function(message, time) {
            this.successes.push(message);
            setTimeout(() => {
                this.removeSuccess(this.successes.indexOf(message));
            }, time || 3000);
        },
        addError: function(message, time) {
            this.errors.push(message);
            setTimeout(() => {
                this.removeError(this.errors.indexOf(message));
            }, time || 3000);
        },
        removeSuccess: function(index) {
            this.successes.splice(index);
        },
        removeError: function(index) {
            this.errors.splice(index);
        },
    }
})
</script>