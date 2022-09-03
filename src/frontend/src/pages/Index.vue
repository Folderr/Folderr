<template>
  <div class="bg-bg h-screen flex flex-col">
    <Navbar url='/'/>
    <SuccessesErrors ref="sne" />
    <div class="flex">
      <div id="hero" class="ml-32 pt-20 flex flex-col w-[40%]">
        <h1 class="text-text text-5xl font-bold underline decoration-brand underline-offset-4 decoration-6 font-headline">
          Folderr
        </h1>
        <p class="text-secondary-text text-md my-2 font-info">
          easy to use and powerful link shortener and file host
        </p>
        <a class="flex justify-center content-center my-5 mt-7 bg-white px-10 py-5 w-max rounded-md font-semibold text-lg" href="https://github.com/Folderr/Folderr">
          <Icon :icon="github" color="#131313" height="30" class="mr-4"/>learn more on GitHub
        </a>
        <div class="my-5 grid grid-rows-2 grid-cols-2 gap-6">
          <div>
            <h1 class="text-text text-3xl font-semibold font-headline">Self-Hostable</h1>
            <p class="text-secondary-text text-lg mt-2 font-info">easily host on any platform.</p>
          </div>
          <div>
            <h1 class="text-text text-3xl font-semibold font-headline">Open Source</h1>
            <p class="text-secondary-text text-lg mt-2 font-info">developers are able to verify code integrity and security at any time.</p>
          </div>
          <div>
            <h1 class="text-text text-3xl font-semibold font-headline">Unbiased</h1>
            <p class="text-secondary-text text-lg mt-2 font-info">Folderr doesn’t care who you are or what you do outside of it.</p>
          </div>
          <div>
            <h1 class="text-text text-3xl font-semibold font-headline">For the User</h1>
            <p class="text-secondary-text text-lg mt-2 font-info">designed to allow users to use their own domains, on any instance.</p>
          </div>
        </div>
      </div>
      <div class="m-auto bg-tertiary-bg rounded-lg border-2 mt-32 border-tertiary-bg px-14 p-10 content-center justify-center">
        <Login :sne="sne" />
        <div class="flex mt-2 justify-center w-[100%] font-headline">
          <p class="text-secondary-text">new here?</p>
          <button class="border-0 bg-transparent text-brand ml-2">Sign Up</button>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { UserAddIcon } from "@heroicons/vue/solid";
import { Icon } from '@iconify/vue';
import github from '@iconify/icons-codicon/github-inverted';
import { ref, Ref } from 'vue';
import SuccessesErrors from "../components/Success-N-Error.vue";
import Login from '../components/Login.vue';

const sne = ref<InstanceType<typeof SuccessesErrors> & {
    addError: (messaage: string, time?: number) => void,
    addSuccess: (message: string, time?: number) => void
}>();

</script>