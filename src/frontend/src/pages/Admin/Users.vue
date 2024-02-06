<template>
	<div class="bg-bg h-screen flex flex-col">
		<NavbarAuthenticated
			:username="username"
			:admin="true"
			class="bg-bg-old"
		/>
		<div class="flex h-full">
			<AdminSidebar />
			<div class="lg:mt-20 mx-auto w-full text-text">
				<div class="flex justify-between grow mx-10">
					<div class="flex space-x-10">
						<h1 class="text-secondary-text w-fit text-xl font-bold">
							User Moderation & Management
						</h1>
						<!-- Impl filtering of user types -->
						<FilterIcon class="h-7 text-secondary-text" />
					</div>
				</div>

				<div
					v-if="userList && userList.length >= 0"
					class="mx-10 grid grid-cols-2 md:grid-cols-5 grid-flow-dense mt-10 gap-4"
				>
					<h2 class="w-fit">Profile</h2>
					<h2 class="hidden md:block w-fit">Email</h2>
					<h2 class="hidden md:block w-fit">Statistics</h2>
					<h2 class="hidden md:block w-fit">Role</h2>
					<h2>Actions</h2>
					<ul
						v-for="user of userList"
						:key="user.username"
						class="grid grid-cols-subgrid col-span-2 md:col-span-5 text-secondary-text"
					>
						<li class="my-auto py-4 w-fit">
							{{ user.username }}
						</li>
						<li class="hidden md:flex my-auto py-4">
							<MailIcon class="h-5 my-auto mr-2 text-brand" />
							{{ user.email }}
						</li>
						<li class="hidden md:flex my-auto py-4">
							<DocumentIcon class="h-5 mr-2 text-brand my-auto" />
							{{ user.statistics.files }} files,
							<LinkIcon class="h-5 mx-2 text-brand my-auto" />
							{{ user.statistics.links }} links
						</li>
						<li class="hidden md:block my-auto py-4">
							{{
								user.role[0].toUpperCase() + user.role.slice(1)
							}}
						</li>
						<li class="flex space-x-2 h-fit my-auto py-4">
							<AdminButton
								class="hidden md:block"
								:button-disabled="user.role === 'owner'"
								:on-click="() => false"
								><div class="flex">
									<FlagIcon class="h-5 my-auto mr-1" />
									Warn
								</div></AdminButton
							>

							<AdminButton
								class="hidden md:block"
								:button-disabled="user.role === 'owner'"
								:on-click="() => false"
								type="red"
								><div class="flex">
									<TrashIcon class="h-5 my-auto mr-1" />
									Delete
								</div></AdminButton
							>
							<AdminButton
								class="hidden md:block"
								:button-disabled="user.role === 'owner'"
								:on-click="() => false"
								type="red"
								><div class="flex">
									<BanIcon class="h-5 my-auto mr-1" />
									Ban
								</div></AdminButton
							>
							<AdminButton
								class="md:hidden"
								:on-click="() => false"
								>Actions & Info</AdminButton
							>
						</li>
					</ul>
				</div>
				<div v-else>No Users Found</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useUserStore } from "../../stores/user";
import * as adminAPI from "../../wrappers/admin-api";
import NavbarAuthenticated from "../../components/Navbar-Authenticated.vue";
import AdminSidebar from "../../components/Admin-Sidebar.vue";
import AdminButton from "../../components/Admin-Button.vue";
import {
	BanIcon,
	FlagIcon,
	TrashIcon,
	MailIcon,
	DocumentIcon,
	LinkIcon,
	FilterIcon,
} from "@heroicons/vue/solid";

const store = useUserStore();

type FilteredUsers = {
	username: string;
	email: string;
	statistics: {
		files: number;
		links: number;
	};
	role: string;
};

const userList = ref<FilteredUsers[]>();

const username = ref(`${store.username}`);

onMounted(async () => {
	if (!username.value) {
		await store.loadUser();
		username.value = store.username ?? "";
	}

	const users = await adminAPI.getUsers();

	// Handle errors later

	if (users.success && users.output && Array.isArray(users.output)) {
		userList.value = users.output.map((user) => {
			return {
				username: user.username,
				email: user.email,
				statistics: { files: user.files, links: user.links },
				role: user.title || "User",
			};
		});
	}
});
</script>
