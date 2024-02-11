<script setup lang="ts">
import { ref } from "vue";

const isOpen = ref(false);

defineProps<{ active?: string }>();
</script>

<!-- eslint-disable max-len -->
<template>
	<aside class="md:w-64 flex flex-col grow-1" aria-label="Sidebar">
		<div
			class="overflow-y-hidden md:py-4 px-3 flex flex-col grow sticky bg-bg-old"
		>
			<button
				class="cursor-pointer text-xl leading-none border border-solid border-transparent rounded bg-transparent block md:hidden outline-none focus:outline-none"
				:class="[
					{
						'my-auto': !isOpen,
					},
				]"
				@click="isOpen = !isOpen"
			>
				<span
					class="block relative w-6 h-px rounded-sm bg-brand"
				></span>
				<span
					class="block relative w-6 h-px rounded-sm mt-1 bg-brand"
				></span>
				<span
					class="block relative w-6 h-px rounded-sm mt-1 bg-brand"
				></span>
			</button>
			<div
				class="md:block"
				:class="[
					{
						hidden: !isOpen,
					},
				]"
			>
				<ul class="space-y-2 mt-4 md:mt-14">
					<li>
						<a
							href="/admin/users"
							class="flex font-bold text-md hover:text-secondary-bg rounded-lg p-2"
							:class="
								active && active === 'user'
									? 'text-white hover:text-secondary-bg hover:bg-brand-darkened bg-tertiary-bg'
									: 'text-secondary-text hover:text-text hover:bg-tertiary-bg'
							"
							>User Management</a
						>
					</li>
				</ul>
			</div>
		</div>
	</aside>
</template>
