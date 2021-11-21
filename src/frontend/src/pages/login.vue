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
            <input v-on:keyup.enter="this.$refs.passw.focus()" v-model="username" placeholder="Username" required class="focus:outline-none mb-4 bg-bg text-brand p-4 border-brand border-b-2 placeholder-secondary-text">
            <br>
            <p v-if="password.length" class="text-secondary-text mr-28">Password</p>
            <input ref="passw" v-on:keyup.enter="this.$refs.login.click()" v-model="password" placeholder="Password" type="password" required class="focus:outline-none mb-8 bg-bg text-brand p-4 border-brand border-b-2 placeholder-secondary-text">
            <br>
            <button ref="login" v-on:click="login()" class="text-brand bg-brand bg-opacity-5 border-2 p-4 border-brand rounded-lg px-16">Login</button>
            <br>
            <p class="text-brand mt-4 underline"><a href="/signup">No account? Make one.</a></p>
        </div>
        <Footer />
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import * as api from '../wrappers/api';

export default defineComponent({
  name: 'Login',
  data () {
      return {
          username: '',
          password: '',
          error: '',
          loading: false,
          signups: false,
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
      const output = await api.login(this.username, this.password);
      if (output.error) {
        if (typeof output.error === 'string') {
            this.error = output.error;
        }

        this.loading = false;
        return;
      }
      if (output.success) {
        this.$router.push('/account')
      }
    },
  }
})
</script>