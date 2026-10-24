<script setup lang="ts">
import { ref } from "vue";

defineProps<{ active?: string }>();

const isOpen = ref(false);
</script>

<template>
	<div
		class="h-full"
		:class="[
			{
				'bg-black/80 lg:bg-transparent fixed w-full': isOpen,
			},
		]"
	>
		<aside class="lg:w-64 flex flex-col grow h-full" aria-label="Sidebar">
			<div
				class="overflow-y-hidden md:py-4 px-3 flex flex-col grow lg:sticky bg-bg-old h-full"
				:class="[
					{
						fixed: isOpen,
					},
				]"
			>
				<button
					type="button"
					class="cursor-pointer text-xl leading-none border border-solid border-transparent rounded-md bg-transparent block lg:hidden outline-hidden focus:outline-hidden"
					:class="[
						{
							'my-auto': !isOpen,
						},
					]"
					@click="isOpen = !isOpen"
				>
					<span
						class="block relative w-6 h-px rounded-xs bg-brand"
					></span>
					<span
						class="block relative w-6 h-px rounded-xs mt-1 bg-brand"
					></span>
					<span
						class="block relative w-6 h-px rounded-xs mt-1 bg-brand"
					></span>
				</button>
				<div
					class="lg:block"
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
								class="flex font-bold text-base hover:text-secondary-bg rounded-lg p-2"
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
	</div>
</template>
