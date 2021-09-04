<template>
  <div class="bg-bg h-screen flex flex-col">
    <Navbar />
    <div id="hero" class="m-auto text-center pt-20 md:pt-48 lg:pt-64 3xl:pt-96 w-full h-4/5 flex-grow">
      <h1 class="text-4xl text-bold text-brand">
        404, Not Found
      </h1>
      <p class="text-text text-2xl my-5">
        Whatever you're looking for, I can't find it.
      </p>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'PageNotFound',
})
</script>