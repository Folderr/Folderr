<template>
  <nav class="relative flex flex-wrap items-center justify-between px-2 py-3">
    <div class="container pr-4 m-auto flex flex-wrap items-center justify-between">
      <div class="w-full relative flex justify-between lg:w-auto px-4 pl-0 lg:static lg:block lg:justify-start">
        <router-link to="/" class="text-2xl font-bold leading-relaxed inline-block mr-0 py-2 whitespace-nowrap text-brand hover:text-opacity-75">
          Folderr
        </router-link>
        <button class="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none" @click="showMenu = !showMenu">
            <span class="block relative w-6 h-px rounded-sm bg-brand"></span>
            <span class="block relative w-6 h-px rounded-sm mt-1 bg-brand"></span>
            <span class="block relative w-6 h-px rounded-sm mt-1 bg-brand"></span>
        </button>
      </div>
      <div v-bind:class="{'hidden': !showMenu, 'flex': showMenu}" class="lg:flex lg:grow items-center text-secondary-text">
          <ul class="flex flex-col lg:flex-row list-none ml-auto">
              <li>
                  <router-link to="/" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-text" :class="[
                    {
                      'text-text': url === '/',
                      'hover:text-brand': url === '/'
                    }
                  ]">
                      <QuestionMarkCircleIcon
                        class="w-5 h-5 mr-2 text-inherit"
                        aria-hidden="true"
                      />
                      why folderr
                  </router-link>
              </li>
              <li>
                  <a href="github.com/Folderr/Folderr" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-text rounded-md">
                      <Icon :icon="github" height="20" class="mr-2"/>
                      learn more
                  </a>
              </li>
              <li>
                  <router-link to="/info" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-text" :class="[
                    {
                      'text-text': url === '/info',
                      'hover:text-brand': url === '/info'
                    }
                  ]">
                      <InformationCircleIcon
                        class="w-5 h-5 mr-2 text-inherit"
                        aria-hidden="true"
                      />
                      info
                  </router-link>
              </li>
          </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {ref, defineProps} from 'vue';
import { InformationCircleIcon, QuestionMarkCircleIcon } from "@heroicons/vue/solid";
import { Icon } from "@iconify/vue";
import github from '@iconify/icons-codicon/github-inverted'

const props = defineProps<{
  url?: '/' | '/info'
}>()

const showMenu = ref(false);

const toggleNavbar = () => {
    showMenu.value = !showMenu.value;
}
</script>