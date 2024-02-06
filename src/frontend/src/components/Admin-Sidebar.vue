<script setup lang="ts">
import { ref } from "vue";

const active = ref("");
</script>

<!-- eslint-disable max-len -->
<template>
	<aside class="w-64 flex flex-col grow" aria-label="Sidebar">
		<div
			class="overflow-y-auto py-4 px-3 flex flex-col grow sticky bg-bg-old"
		>
			<ul class="space-y-2">
				<li>
					<a
						href="/admin/users"
						class="flex text-white font-bold text-lg hover:text-secondary-bg hover:bg-brand-darkened rounded p-2"
						>User Management</a
					>
				</li>
			</ul>
		</div>
	</aside>
</template>
