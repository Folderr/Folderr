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
      <div v-bind:class="{'hidden': !showMenu, 'flex': showMenu}" class="lg:flex lg:flex-grow items-center text-secondary-text">
          <ul class="flex flex-col lg:flex-row list-none ml-auto">
              <li>
                  <router-link to="/info" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-primary">
                      Info
                  </router-link>
              </li>
              <li>
                  <router-link to="/upload" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-primary">
                      Upload
                  </router-link>
              </li>
              <li>
                  <router-link to="/account" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-primary">
                      {{username}}
                  </router-link>
              </li>
              <li>
                  <button v-on:click="logout()" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-primary">
                    Logout
                  </button>
              </li>
          </ul>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import * as api from '../../wrappers/api';
export default defineComponent({
    name: 'Navbar',
    props: ['username'],
    data() {
        return {
        showMenu: false
        }
    },
    methods: {
        toggleNavbar: function() {
            this.showMenu = !this.showMenu;
        },
        logout: async function() {
            const output = await api.logout();

            if (output.success) {
                this.$router.push('/');
                return;
            }

            if (output.error instanceof Error) {
                console.log(`Logout Error: ${output.error.message}`);
            } else if (typeof output.error === 'string') {
                console.log(`Logout Error: ${output.error}`);
            }
        }
    }
})
</script>