<template>
  <div class="bg-bg h-screen flex flex-col">
    <Navbar />
    <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 flex-grow">
      <h1 class="text-text text-4xl text-bold">
        Folderr
      </h1>
      <p class="text-secondary-text text-lg my-5">
        File Host, Link Shortener
      </p>
      <button class="rounded-full text-brand border-brand border-4 px-8 py-4 text-2xl bg-brand bg-opacity-10">
        Signup
      </button>
      <div id="footnote" class="mt-32 2xl:mt-28">
        <a class="text-secondary-text underline text-md" href="https://folderr.net/about">Learn more at folderr.net</a>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'Index',
})
</script>
