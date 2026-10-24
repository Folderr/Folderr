<script setup lang="ts">
import { ref } from "vue";
import { UserIcon, MenuIcon, XIcon } from "@heroicons/vue/solid";

const isOpen = ref(false);

defineProps<{ active?: string }>();
</script>

<template>
	<div>
		<!-- Mobile Toggle -->
		<div class="lg:hidden p-4 border-b border-[#333] flex items-center justify-between bg-[#1e1e1e]">
			<span class="font-bold text-sm text-brand">Admin Console</span>
			<button
				class="p-2 rounded-lg text-secondary-text hover:text-text hover:bg-tertiary-bg transition"
				@click="isOpen = !isOpen"
			>
				<MenuIcon v-if="!isOpen" class="w-5 h-5" />
				<XIcon v-else class="w-5 h-5" />
			</button>
		</div>

		<!-- Sidebar Container -->
		<aside
			:class="[
				'lg:w-64 flex flex-col h-full bg-[#1e1e1e]/90 border-r border-[#333333] transition-all',
				isOpen ? 'block' : 'hidden lg:flex'
			]"
			aria-label="Admin Sidebar"
		>
			<div class="p-6">
				<p class="text-xs font-bold uppercase tracking-wider text-secondary-text mb-4">Administration</p>
				<ul class="space-y-1.5">
					<li>
						<router-link
							to="/admin/users"
							:class="[
								'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition',
								active === 'user'
									? 'bg-brand/15 text-brand font-bold'
									: 'text-secondary-text hover:text-text hover:bg-[#2c2c2c]'
							]"
						>
							<UserIcon class="w-4 h-4" />
							<span>User Management</span>
						</router-link>
					</li>
				</ul>
			</div>
		</aside>
	</div>
</template>
