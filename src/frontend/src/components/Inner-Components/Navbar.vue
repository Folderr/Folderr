<template>
  <nav class="relative flex flex-wrap items-center justify-between px-2 py-3 bg-secondary-bg">
    <div class="container pr-4 pl-2 m-auto flex flex-wrap items-center justify-between">
      <div class="w-full relative flex justify-between lg:w-auto px-4 pl-0 lg:static lg:block lg:justify-start">
        <router-link to="/" class="text-2xl font-bold leading-relaxed inline-block mr-2 py-2 whitespace-nowrap text-brand hover:text-opacity-75">
          Folderr
        </router-link>
      </div>
      <div v-bind:class="{'hidden': !showMenu, 'flex': showMenu}" class="lg:flex lg:flex-grow items-center text-secondary-text">
          <ul class="flex flex-col lg:flex-row list-none ml-auto">
              <li>
                  <router-link to="/info" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-primary">
                      Info
                  </router-link>
              </li>
              <li>
                  <router-link to="/login" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-primary" href="/login">
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

<script lang="ts">
import {defineComponent} from 'vue'
export default defineComponent({
    name: 'Navbar',
    data() {
        return {
        showMenu: false
        }
    },
    methods: {
        toggleNavbar: function()    {
            this.showMenu = !this.showMenu;
        }
    }
})
</script>