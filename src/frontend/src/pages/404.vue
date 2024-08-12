<template>
  <div class="bg-bg h-screen flex flex-col">
    <FNavbar v-if="!username || !admin"/>
    <NavbarAuthenticated v-if="username" :username="username" :admin="admin" />
    <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 grow">
      <h1 class="text-4xl text-bold text-brand">
        404, Not Found
      </h1>
      <p class="text-text text-2xl my-5">
        Whatever you're looking for, I can't find it.
      </p>
    </div>
    <FFooter />
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useUserStore} from '../stores/user.js';
import NavbarAuthenticated from "../components/Navbar-Authenticated.vue";

const store = useUserStore();
const username = ref('');
const admin = ref(false);

if (store.username) {
  admin.value = store.admin;
  username.value = store.username;
}
</script>
