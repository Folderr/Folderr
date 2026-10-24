<template>
	<footer class="border-t border-[#333333]/80 bg-[#181818]/70 py-6 mt-auto">
		<div
			class="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary-text"
		>
			<div class="flex items-center gap-2">
				<span class="font-extrabold text-brand tracking-tight text-sm"
					>Folderr</span
				>
				<span class="text-[#555]">•</span>
				<span>Open-source media host & link shortener</span>
			</div>
			<div class="flex items-center gap-5">
				<a
					href="https://github.com/Folderr/Folderr"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-brand transition flex items-center gap-1.5"
				>
					<Icon :icon="github" class="w-4 h-4" />
					<span>GitHub</span>
				</a>
				<span class="text-[#555]">•</span>
				<span
					>&copy; {{ currentYear }} Folderr. All rights
					reserved.</span
				>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import github from "@iconify-icons/codicon/github-inverted";

const currentYear = new Date().getFullYear();
</script>
