<template>
	<div class="bg-bg h-screen flex flex-col">
		<NavbarAuthenticated
			:username="username"
			:admin="true"
			class="bg-bg-old"
		/>
		<div class="flex h-full">
			<AdminSidebar active="user" />
			<div class="lg:mt-20 mx-auto w-full text-text max-h-full">
				<div
					class="flex justify-between mx-5 md:mx-10"
					:class="{
						'md:mx-32': filter === 'Verifying Users',
					}"
				>
					<!-- Impl filtering of user types -->
					<div>
						<Listbox v-model="filter">
							<!-- eslint-disable max-len -->
							<ListboxButton
								class="flex grow my-auto text-secondary-text p-2 rounded-lg bg-bg-old"
								><FilterIcon class="rounded-lg h-7 my-auto" />
								<h1
									class="font-bold my-auto text-xl p-2 bg-bg-old rounded-lg text-brand"
								>
									<!-- eslint-enable max-len -->
									{{ filter }} Management
								</h1>
							</ListboxButton>
							<ListboxOptions
								class="absolute mt-2 p-2 bg-bg-old rounded-lg w-64"
							>
								<ListboxOption
									v-for="option in filters"
									:key="option"
									:value="option"
									class="mt-1 text-secondary-text hover:text-text"
									>{{ option }} Management</ListboxOption
								>
							</ListboxOptions>
						</Listbox>
					</div>
					<div
						class="flex text-secondary-text w-64 p-2 px-8 border-b-2 border-brand h-fit"
					>
						<p>Search...</p>
					</div>
				</div>

				<!-- eslint-disable max-len -->
				<div
					v-if="
						verifyingUsers &&
						verifyingUsers.length > 0 &&
						filter === 'Verifying Users'
					"
					class="mx-10 lg:mx-32 justify-center grid grid-cols-2 md:grid-cols-3 grid-flow-dense mt-10"
				>
					<!-- eslint-enable max-len -->
					<h2 class="">Profile</h2>
					<h2 class="hidden md:block">Email</h2>
					<h2>Actions</h2>
					<ul
						v-for="user of verifyingUsers"
						:key="user.username"
						class="grid grid-cols-subgrid col-span-2 md:col-span-3 text-secondary-text"
					>
						<li class="my-auto py-4">
							{{ user.username }}
						</li>
						<li class="hidden md:flex my-auto py-4">
							<MailIcon class="h-5 my-auto mr-2 text-brand" />
							{{ user.email }}
						</li>
						<li class="flex space-x-2 h-fit my-auto">
							<AdminButton
								class="hidden md:block"
								:on-click="() => acceptUser(user.id)"
								><div class="flex">
									<UserAddIcon class="h-5 my-auto mr-1" />
									Accept
								</div></AdminButton
							>

							<AdminButton
								class="hidden md:block"
								:on-click="() => denyUser(user.id)"
								type="red"
								><div class="flex">
									<TrashIcon class="h-5 my-auto mr-1" />
									Deny
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
				<div
					v-else-if="
						userList && userList.length >= 0 && filter === 'Users'
					"
					class="mx-10 grid grid-cols-2 md:grid-cols-5 grid-flow-dense mt-10 gap-x-4"
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
								:on-click="() => deleteUser(user.id)"
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
				<div
					v-else
					class="mx-auto font-bold text-4xl w-fit text-secondary-text my-20"
				>
					No Users Found Under
					<span class="text-brand">{{ filter }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import {
	Listbox,
	ListboxButton,
	ListboxOptions,
	ListboxOption,
} from "@headlessui/vue";
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
	UserAddIcon,
} from "@heroicons/vue/solid";

const filters = ["Users", "Verifying Users", "Banned Emails"];
const filter = ref(filters[0]);

const verifyingUsers = ref<VerifyingUsers[]>();

const userList = ref<FilteredUsers[]>();

// When the filter changes lets do the appropriate calls for the filter

watch(filter, async (value, oldValue) => {
	if (value === "Users") {
		const users = await adminAPI.getUsers();

		// Handle errors later

		if (users.success && users.output && Array.isArray(users.output)) {
			userList.value = users.output.map((user) => {
				return {
					username: user.username,
					email: user.email,
					statistics: { files: user.files, links: user.links },
					role: user.title || "User",
					id: user.id,
				};
			});
		}
	} else if (value === "Verifying Users") {
		const users = await adminAPI.getVerifyingUsers();

		if (users.success && users.output) {
			verifyingUsers.value = users.output;
		}
	}
});

async function denyUser(id: string) {
	const output = await adminAPI.denyAccount(id);
	if (output.error ?? !output.success) {
		console.log(output.error ?? "Unknown Error");
		return;
	}

	verifyingUsers.value = verifyingUsers.value?.filter(
		(user) => user.id !== id
	);
	console.log(output.output);
}

async function acceptUser(id: string) {
	const output = await adminAPI.acceptAccount(id);
	if (output.error ?? !output.success) {
		console.log(output.error ?? "Unknown Error");
		return;
	}

	const user = verifyingUsers.value?.find((user) => user.id === id);

	verifyingUsers.value = verifyingUsers.value?.filter(
		(user) => user.id !== id
	);
	if (user) {
		userList.value?.push({
			username: user.username,
			email: user.email,
			statistics: {
				files: 0,
				links: 0,
			},
			role: "User",
			id: user.id,
		});
	}

	console.log(output.output);
}

async function deleteUser(id: string) {
	const output = await adminAPI.deleteAccount(id);
	if (output.error ?? !output.success) {
		console.log(output.error ?? "Unknown Error");
		return;
	}

	userList.value = userList.value?.filter((user) => user.id !== id);

	console.log(output.output);
}

const store = useUserStore();

type FilteredUsers = {
	username: string;
	email: string;
	statistics: {
		files: number;
		links: number;
	};
	role: string;
	id: string;
};

type VerifyingUsers = {
	username: string;
	id: string;
	email: string;
	createdAt: Date;
};

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
				id: user.id,
			};
		});
	}
});
</script>
