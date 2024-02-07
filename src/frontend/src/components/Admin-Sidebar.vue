<script setup lang="ts">
import { ref } from "vue";

defineProps<{ active?: string }>();
</script>

<!-- eslint-disable max-len -->
<template>
	<aside class="w-64 flex flex-col grow" aria-label="Sidebar">
		<div
			class="overflow-y-auto py-4 px-3 flex flex-col grow sticky bg-bg-old"
		>
			<ul class="space-y-2 mt-14">
				<li>
					<a
						href="/admin/users"
						class="flex font-bold text-lg hover:text-secondary-bg rounded-lg p-2"
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
	</aside>
</template>
