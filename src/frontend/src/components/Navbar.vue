<template>
  <nav class="relative flex flex-wrap items-center justify-between px-2 py-3 bg-secondary-bg">
    <div class="container pr-4 pl-2 m-auto flex flex-wrap items-center justify-between">
      <div class="w-full relative flex justify-between lg:w-auto px-4 pl-0 lg:static lg:block lg:justify-start">
        <router-link to="/" class="text-2xl font-bold leading-relaxed inline-block mr-2 py-2 whitespace-nowrap text-brand hover:text-opacity-75">
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
                  <router-link to="/info" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-primary">
                      Info
                  </router-link>
              </li>
              <li>
                  <router-link to="/login" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-secondary-bg hover:bg-brand rounded-md" href="/login">
                      Login
                  </router-link>
              </li>
              <li>
                  <button class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-primary">
                      Signup
                  </button>
              </li>
          </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {ref} from 'vue';

const showMenu = ref(false);

const toggleNavbar = () => {
    showMenu.value = !showMenu.value;
}
</script>