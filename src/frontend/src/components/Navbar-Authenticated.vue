<template>
  <nav class="relative flex flex-wrap items-center justify-between px-2 py-3">
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
                      <InformationCircleIcon
                        class="w-5 h-5 mr-2 text-inherit"
                        aria-hidden="true"
                      />
                      Info
                  </router-link>
              </li>
              <li>
                  <router-link to="/upload" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-text hover:bg-tertiary-bg rounded-md">
                      <UploadIcon
                        class="w-5 h-5 mr-2 text-inherit"
                        aria-hidden="true"
                      />
                      Upload
                  </router-link>
              </li>
              <li>
                  <router-link to="/shorten" class="px-3 py-2 flex items-center text-md font-bold leading-snug hover:text-text hover:bg-tertiary-bg rounded-md">
                    <LinkIcon
                      class="w-5 h-5 mr-2 text-inherit"
                      aria-hidden="true"
                    />
                    Shorten
                  </router-link>
              </li>
              <li>
                  <div>
                      <Menu as="div" class="inline-block text-left">
                            <MenuButton class="text-md font-bold leading-snug inline-flex justify-center w-full hover:text-text hover:bg-tertiary-bg px-3 py-2 rounded-md">
                              <UserIcon
                                class="w-5 h-5 mr-2 text-inherit"
                                aria-hidden="true"
                              />
                              Account
                              <ChevronDownIcon
                                class="w-5 h-5 ml-2 -mr-1 text-inherit"
                                aria-hidden="true"
                              />
                            </MenuButton>
                            <transition
                                enter-active-class="transition duration-100 ease-out"
                                enter-from-class="transform scale-95 opacity-0"
                                enter-to-class="transform scale-100 opacity-100"
                                leave-active-class="transition duration-75 ease-in"
                                leave-from-class="transform scale-100 opacity-100"
                                leave-to-class="transform scale-95 opacity-0"
                            >
                                <MenuItems class="absolute mt-2 rounded-md bg-[#303030]">
                                    <MenuItem>
                                        <router-link to="/account" class="leading-snug group flex rounded-md items-center w-full px-6 py-2 hover:text-text hover:bg-tertiary-bg">
                                            <CogIcon class="w-5 h-5 mr-2" aria-hidden="true"/>
                                            Settings
                                        </router-link>
                                    </MenuItem>
                                    <MenuItem>
                                        <button @click="logout" class="leading-snug group flex rounded-md items-center w-full px-6 py-2 hover:bg-red-800 hover:text-text">
                                            <LogoutIcon class="w-5 h-5 mr-2" aria-hidden="true"/>
                                            Logout
                                        </button>
                                    </MenuItem>
                                </MenuItems>
                            </transition>
                    </Menu>
                  </div>
              </li>
              <li>
                  <div class="w-auto" v-if="admin">
                      <Menu as="div" class="inline-block text-left w-min">
                            <MenuButton class="text-md font-bold leading-snug inline-flex justify-center w-full hover:text-text hover:bg-tertiary-bg px-3 py-2 rounded-md">
                              <FingerPrintIcon
                                class="w-5 h-5 mr-2 text-inherit"
                                aria-hidden="true"
                              />
                              Admin
                              <ChevronDownIcon
                                class="w-5 h-5 ml-2 -mr-1 text-inherit"
                                aria-hidden="true"
                              />
                            </MenuButton>
                            <transition
                                enter-active-class="transition duration-100 ease-out"
                                enter-from-class="transform scale-95 opacity-0"
                                enter-to-class="transform scale-100 opacity-100"
                                leave-active-class="transition duration-75 ease-in"
                                leave-from-class="transform scale-100 opacity-100"
                                leave-to-class="transform scale-95 opacity-0"
                            >
                                <MenuItems class="absolute mt-2 rounded-md bg-[#303030]">
                                    <MenuItem>
                                        <router-link to="/admin" class="leading-snug group flex rounded-md items-center w-full px-4 py-2 hover:text-text hover:bg-tertiary-bg">
                                            <HomeIcon class="w-5 h-5 mr-2" aria-hidden="true"/>
                                            Overview
                                        </router-link>
                                    </MenuItem>
                                </MenuItems>
                            </transition>
                    </Menu>
                  </div>
              </li>
          </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import * as api from '../wrappers/api';
import { useRouter } from 'vue-router';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
import {LogoutIcon, ChevronDownIcon, CogIcon, HomeIcon, UserIcon, FingerPrintIcon, UploadIcon, InformationCircleIcon, LinkIcon} from '@heroicons/vue/solid';
const router = useRouter();

const props = defineProps<{
    username: string;
    admin?: boolean;
}>();

const emit = defineEmits<{
    (e: 'error', error: Error | string): void
}>();

const showMenu = ref(false);

const toggleNavbar = () => {
    showMenu.value = !showMenu.value;
}

const logout = async (): Promise<void> => {
    const output = await api.logout();

    if (output.success) {
        router.push('/');
        return;
    }

    if (output.error instanceof Error) {
        console.log(`Logout Error: ${output.error.message}`);
        emit('error', output.error);
    } else if (typeof output.error === 'string') {
        console.log(`Logout Error: ${output.error}`);
        emit('error', output.error);
    }
}
</script>