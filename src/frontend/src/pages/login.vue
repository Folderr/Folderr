<template>
    <div class="bg-bg h-screen flex flex-col">
        <Navbar />
        <div v-if="error.length" class="justify-center bg-secondary-accent text-white w-full p-4 text-center flex m-auto">
            <p v-if="error.length">{{error}}</p>
            <button v-on:click="() => {error = ''}" class="bg-none border-none text-black ml-4">X</button>
        </div>
        <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 flex-grow">
            <h1 class="text-secondary-text text-3xl mb-8">Login</h1>
            <p v-if="username.length" class="text-secondary-text mr-28">Username</p>
            <input v-model="username" placeholder="Username" required class="mb-4 bg-bg text-brand p-4 border-brand border-b-2 placeholder-secondary-text">
            <br>
            <p v-if="password.length" class="text-secondary-text mr-28">Password</p>
            <input v-model="password" placeholder="Password" type="password" required class="mb-8 bg-bg text-brand p-4 border-brand border-b-2 placeholder-secondary-text">
            <br>
            <button v-on:click="login()" class="text-white bg-bg border-2 p-4 border-brand rounded-lg px-16">Login</button>
        </div>
        <Footer />
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'Signup',
  data () {
      return {
          username: '',
          password: '',
          error: '',
          loading: false,
      }
  },
  methods: {
    async login () {
      if (this.loading) {
        return;
      }
      if (!this.username || !this.password) {
        let missing = [];
        if (!this.username) {
            missing.push('username');
        }
        if (!this.password) {
            missing.push('password');
        }
        this.error = `Error: Missing ${missing.join(' & ')}`;
        return;
      }
      this.loading = true;
      try {
        const response = await fetch(`/api/authorize`, {
          method: 'POST',
          headers: {
            username: this.username,
            password: this.password,
          }
        });
        if (response.status === 400) {
          this.loading = false;
          this.error = `Error: Bad Request`;
          console.log(`DEBUG: ${await response.json()}`);
          return;
        }
        if (response.status === 401) {
          this.loading = false;
          this.error = `Authorization Failed`;
          return;
        }
        if (/5[0-9]{2}/.test(response.status.toString())) {
          this.loading = false;
          this.error = `Internal Server Error`;
          return;
        }
        const out = await response.json();
        if (out.code === 200) {
          localStorage.setItem('token', out.message);
          this.$store.commit('user/setToken', out.message);
          this.$router.push('/account');
        }
      } catch (e) {
          this.loading = false;
          this.error = `An unkown error occured`;
          if (e.message !== 'Failed to fetch') {
            console.log(`DEBUG Error: ${e}`);
          }
      }
    }
  }
})
</script>