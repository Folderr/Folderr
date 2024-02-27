<template>
	<div class="bg-bg h-screen flex flex-col">
		<!-- Modal for Reason -->
		<FlexibleModal
			v-if="localReason"
			:hide="Boolean(localReason.reasonFor)"
			:header="`What is Your Reason ${localReason.reasonFor}?`"
			:cancel="cancelReason"
			:cont="
				(input) => {
					if (!localReason) return;
					localReason.continue(input);
				}
			"
			continue-text="Confirm"
			:show-input="true"
			:need-input="true"
		>
			<p class="text-secondary-text">
				<!-- eslint-disable-next-line max-len-->
				Please provide a reason
			</p></FlexibleModal
		>
		<!-- Modal For Selected User -->
		<Dialog
			:open="selectedUser !== undefined"
			class="z-40"
			@close="closeUserDialog"
		>
			<div
				class="bg-black fixed inset-0 bg-black/30"
				aria-hidden="true"
			/>
			<div
				class="fixed inset-0 flex grow w-screen items-center justify-center p-4"
			>
				<DialogPanel
					class="m-5 bg-bg-old text-text w-full md:w-fit p-10 rounded flex flex-col"
				>
					<div class="flex justify-between w-full">
						<DialogTitle class="text-brand font-bold text-xl"
							>User Info</DialogTitle
						>
						<button class="w-fit" :onClick="closeUserDialog">
							<span class="sr-only">Close User Info Modal</span>
							<XIcon class="h-5 text-white" />
						</button>
					</div>
					<DialogDescription class="mb-4 text-secondary-text"
						>Showing information for
						{{ selectedUser?.user.username }}</DialogDescription
					>

					<!-- User Info -->
					<div
						class="grid grid-cols-2 grid-flow-row-dense w-fit gap-x-4 gap-y-2"
					>
						<h2>Username</h2>
						<p class="text-secondary-text w-fit">
							{{ selectedUser?.user.username }}
						</p>
						<h2>Email</h2>
						<p class="text-secondary-text w-fit">
							{{ selectedUser?.user.email }}
						</p>
						<h2 v-if="selectedUser?.type === 'User'" class="w-fit">
							Statistics
						</h2>
						<p
							v-if="selectedUser?.type === 'User'"
							class="text-secondary-text flex w-fit"
						>
							<DocumentIcon class="h-5 mr-2 text-brand my-auto" />
							{{ selectedUser.user.statistics.files }} files,
							<LinkIcon class="h-5 mx-2 text-brand my-auto" />
							{{ selectedUser.user.statistics.links }} links
						</p>
						<h2 v-if="selectedUser?.type === 'User'" class="w-fit">
							Role
						</h2>
						<p
							v-if="selectedUser?.type === 'User'"
							class="text-secondary-text flex w-fit"
						>
							{{
								selectedUser.user.role[0].toUpperCase() +
								selectedUser.user.role.slice(1)
							}}
						</p>
						<h2 class="w-fit">Actions</h2>
						<div
							v-if="
								selectedUser?.type === 'User' &&
								canModifyUser(selectedUser.user)
							"
							class="grid-cols-2 grid gap-y-2 gap-x-2 w-fit"
						>
							<AdminButton
								:on-click="
									() =>
										setReasonWarn(
											// @ts-expect-error, we've checked this
											selectedUser?.user.id
										)
								"
								class="flex align-middle"
								><FlagIcon class="h-5 align-middle mr-1" />
								<p>Warn</p></AdminButton
							>
							<AdminButton
								v-if="
									store.owner &&
									selectedUser.user.role !== 'admin'
								"
								:on-click="
									() =>
										selectedUser &&
										promoteUser(selectedUser.user.id)
								"
								class="flex align-middle"
								><ShieldCheckIcon
									class="h-5 align-middle mr-1"
								/>
								<p>Promote</p>
							</AdminButton>
							<AdminButton
								v-if="
									store.owner &&
									selectedUser.user.role == 'admin'
								"
								:on-click="
									() =>
										selectedUser &&
										setReasonDemote(selectedUser?.user.id)
								"
								type="red"
								class="flex align-middle"
								><ShieldExclamationIcon
									class="h-5 my-auto mr-1"
								/>
								<p>Demote</p>
							</AdminButton>
							<AdminButton
								:on-click="
									async () => {
										await setReasonDelete(
											// @ts-expect-error, we've checked this
											selectedUser?.user.id
										);
									}
								"
								type="red"
								class="flex align-middle"
								><TrashIcon class="h-5 align-middle mr-1" />
								<p class="flex">Delete</p></AdminButton
							>
							<AdminButton
								:on-click="
									() =>
										setReasonBan(
											// @ts-expect-error, we've checked this
											selectedUser?.user.id
										)
								"
								type="red"
								class="flex align-middle"
								><BanIcon class="h-5 align-middle mr-1" />
								<p>Ban</p></AdminButton
							>
						</div>
						<div
							v-else-if="selectedUser?.type === 'Verifying'"
							class="grid-cols-2 grid gap-y-1 gap-x-2 w-fit"
						>
							<AdminButton
								:on-click="
									() =>
										selectedUser &&
										acceptUser(selectedUser.user.id)
								"
								class="flex align-middle"
								><UserAddIcon class="h-5 align-middle mr-1" />
								<p>Accept</p></AdminButton
							>

							<AdminButton
								:on-click="
									() =>
										selectedUser &&
										denyUser(selectedUser.user.id)
								"
								type="red"
								class="flex"
								><TrashIcon class="h-5 my-auto mr-1" />
								<p>Deny</p></AdminButton
							>
						</div>
						<div v-else class="text-secondary-text">
							No Actions Available
						</div>
					</div>
					<div class="text-secondary-text flex justify-between"></div>
				</DialogPanel>
			</div>
		</Dialog>
		<!-- Navbar -->
		<NavbarAuthenticated
			:username="username"
			:admin="true"
			class="bg-bg-old"
		/>
		<SuccessNError ref="sne" />
		<!-- Begin content -->
		<div class="flex h-full">
			<!-- Sidebar -->
			<AdminSidebar active="user" />
			<!-- Filter & "Search Bar" (aesthetics only atm) -->
			<div class="mt-5 lg:mt-20 mx-auto w-full text-text max-h-full">
				<div
					class="flex justify-between mx-5 md:mx-10"
					:class="{
						'lg:mx-32':
							filter === 'Verifying Users' ||
							filter === 'Banned Emails',
					}"
				>
					<!-- Impl filtering of user types -->
					<div>
						<Listbox v-model="filter">
							<!-- eslint-disable max-len -->
							<ListboxButton
								class="flex grow my-auto text-secondary-text p-2 rounded-lg bg-bg-old"
								><FilterIcon
									class="rounded-lg h-5 lg:h-7 my-auto"
								/>
								<h1
									class="font-bold my-auto text-base lg:text-xl p-2 bg-bg-old rounded-lg text-brand"
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
					<!-- eslint-disable max-len -->
					<div
						class="hidden md:flex text-secondary-text w-64 p-2 px-8 border-b-2 border-brand h-fit"
					>
						<!-- eslint-enable max-len -->
						<p>Search...</p>
					</div>
				</div>

				<!-- eslint-disable max-len -->
				<!-- Grid of users & their headers (for determing what info you're viewing) -->
				<!-- Verifying Users -->
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
								class="hidden lg:block"
								:on-click="() => acceptUser(user.id)"
								><div class="flex">
									<UserAddIcon class="h-5 my-auto mr-1" />
									Accept
								</div></AdminButton
							>

							<AdminButton
								class="hidden lg:block"
								:on-click="() => denyUser(user.id)"
								type="red"
								><div class="flex">
									<TrashIcon class="h-5 my-auto mr-1" />
									Deny
								</div></AdminButton
							>
							<AdminButton
								class="lg:hidden"
								:on-click="
									() => openUserDialog(user.id, 'Verifying')
								"
								>Actions & Info</AdminButton
							>
						</li>
					</ul>
				</div>
				<!-- Users -->
				<!-- eslint-disable max-len -->
				<div
					v-else-if="
						userList && userList.length >= 0 && filter === 'Users'
					"
					class="mx-10 grid grid-cols-2 md:grid-cols-3 xl-grid-cols-4 2xl:grid-cols-5 grid-flow-dense mt-10 gap-x-4"
				>
					<!-- eslint-enable max-len -->
					<h2 class="w-fit">Profile</h2>
					<h2 class="hidden md:block w-fit">Email</h2>
					<h2 class="hidden xl:block w-fit">Statistics</h2>
					<h2 class="hidden xl:block w-fit">Role</h2>
					<h2>Actions</h2>
					<!-- eslint-disable max-len -->
					<ul
						v-for="user of userList"
						:key="user.username"
						class="grid grid-cols-subgrid col-span-2 md:col-span-3 xl:col-span-4 2xl:col-span-5 text-secondary-text"
					>
						<!-- eslint-enable max-len -->
						<li class="my-auto py-4 w-fit">
							{{ user.username }}
						</li>
						<li class="hidden md:flex my-auto py-4">
							<MailIcon class="h-5 my-auto mr-2 text-brand" />
							{{ user.email }}
						</li>
						<li class="hidden 2xl:flex my-auto py-4">
							<DocumentIcon class="h-5 mr-2 text-brand my-auto" />
							{{ user.statistics.files }} files,
							<LinkIcon class="h-5 mx-2 text-brand my-auto" />
							{{ user.statistics.links }} links
						</li>
						<li class="hidden xl:block my-auto py-4">
							{{
								user.role[0].toUpperCase() + user.role.slice(1)
							}}
						</li>
						<li class="flex space-x-2 h-fit my-auto py-4">
							<AdminButton
								class="hidden lg:block"
								:button-disabled="user.role === 'owner'"
								:on-click="() => setReasonWarn(user.id)"
								><div class="flex">
									<FlagIcon class="h-5 my-auto mr-1" />
									Warn
								</div></AdminButton
							>

							<AdminButton
								class="hidden lg:block"
								:button-disabled="user.role === 'owner'"
								:on-click="() => setReasonDelete(user.id)"
								type="red"
								><div class="flex">
									<TrashIcon class="h-5 my-auto mr-1" />
									Delete
								</div></AdminButton
							>
							<AdminButton
								class="hidden lg:block"
								:on-click="
									() => openUserDialog(user.id, 'User')
								"
								>More...</AdminButton
							>
							<AdminButton
								class="lg:hidden"
								:on-click="
									() => openUserDialog(user.id, 'User')
								"
								>Actions & Info</AdminButton
							>
						</li>
					</ul>
				</div>
				<!-- eslint-disable max-len -->
				<div
					v-else
					class="mx-auto font-bold text-lg md:text-2xl lg:text-4xl w-fit text-secondary-text my-20"
				>
					<!-- eslint-enable max-len -->
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
	Dialog,
	DialogTitle,
	DialogDescription,
	DialogPanel,
} from "@headlessui/vue";
import { useUserStore } from "../../stores/user";
import * as adminAPI from "../../wrappers/admin-api";
import * as managementAPI from "../../wrappers/management-api";
import * as newAPI from "fldrr-web-sdk";
import NavbarAuthenticated from "../../components/Navbar-Authenticated.vue";
import AdminSidebar from "../../components/Admin-Sidebar.vue";
import AdminButton from "../../components/Admin-Button.vue";
import FlexibleModal from "../../components/Modals/NewFlexible.vue";
import SuccessNError from "../../components/Success-N-Error.vue";
import {
	BanIcon,
	FlagIcon,
	TrashIcon,
	MailIcon,
	DocumentIcon,
	LinkIcon,
	FilterIcon,
	UserAddIcon,
	ShieldCheckIcon,
	ShieldExclamationIcon,
	XIcon,
} from "@heroicons/vue/solid";

const api = newAPI.setup();

// Reason modal
type ReasonModal = {
	reasonFor: string;
	needInput?: boolean;
	greenConfirm?: boolean;
	continue: (text: string | undefined) => any;
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
const sne = ref<InstanceType<typeof SuccessNError>>();
const localReason = ref<ReasonModal>();

const cancelReason = () => {
	localReason.value = undefined;
};

const setReasonDelete = (userid: string) => {
	const user = userList.value?.find((user) => user.id === userid);
	if (!user) return;
	localReason.value = {
		reasonFor: `to delete ${user.username}`,
		continue: async (text) => reasonDelete(user, text),
	};
};

const reasonDelete = async (
	user: FilteredUsers,
	reason: string | undefined
) => {
	if (!reason) {
		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value?.addError(`Need a reason for that.`);
		}

		return;
	}

	const output = await adminAPI.deleteAccount(user.id, reason);
	if (output.error ?? !output.success) {
		if (output.error instanceof Error && sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error.message);
		} else if (sne.value && !(output.error instanceof Error)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error ?? "Unknown Error");
		}
	} else if (sne.value) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		sne.value.addSuccess(`Deleted ${user.username}`);
	}

	userList.value = userList.value?.filter(
		(localUser) => localUser.id !== user.id
	);

	if (selectedUser.value) {
		closeUserDialog();
	}

	await loadUsers();
	const result = await deleteUser(user.id, reason);
	if (result instanceof Error && sne.value) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		sne.value.addError(result.message);
	} else if (sne.value) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		sne.value.addSuccess(`Deleted ${user.username}`);
	}

	cancelReason();
};

const setReasonWarn = (userid: string) => {
	const user = userList.value?.find((user) => user.id === userid);
	if (!user) {
		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value?.addError(`User not found ${userid}`);
		}

		return;
	}

	localReason.value = {
		reasonFor: `to warn ${user.username}`,
		async continue(reason) {
			await reasonWarn(user, reason);
		},
	};
};

const reasonWarn = async (
	user: FilteredUsers,
	localReason: string | undefined
) => {
	if (!localReason) {
		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value?.addError(`Need a reason for that.`);
		}

		return;
	}

	const output = await adminAPI.warnUser(user.id, localReason);
	if (output.error ?? !output.success) {
		if (output.error instanceof Error && sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error.message);
		} else if (sne.value && !(output.error instanceof Error)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error ?? "Unknown Error");
		}
	} else if (sne.value) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		sne.value.addSuccess(`Warned ${user.username}`);
	}

	cancelReason();

	if (selectedUser.value) {
		closeUserDialog();
	}
};

const setReasonBan = (userid: string) => {
	const user = userList.value?.find((user) => user.id === userid);
	if (!user) {
		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value?.addError(`User not found ${userid}`);
		}

		return;
	}

	localReason.value = {
		reasonFor: `to ban ${user.username}`,
		continue: async (reason) => reasonBan(user, reason),
	};
};

const reasonBan = async (user: FilteredUsers, reason: string | undefined) => {
	if (!reason) {
		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value?.addError(`Need a reason for that.`);
		}

		return;
	}

	const output = await adminAPI.banUser(user.id, reason);
	if (output.error ?? !output.success) {
		if (output.error instanceof Error && sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error.message);
		} else if (sne.value && !(output.error instanceof Error)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error ?? "Unknown Error");
		}
	} else if (sne.value) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		sne.value.addSuccess(`Banned ${user.username}`);
	}

	userList.value = userList.value?.filter(
		(localUser) => localUser.id !== user.id
	);
	cancelReason();

	if (selectedUser.value) {
		closeUserDialog();
	}

	await loadUsers();
};

const setReasonDemote = (userid: string) => {
	const user = userList.value?.find((user) => user.id === userid);
	if (!user) {
		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value?.addError(`User not found ${userid}`);
		}

		return;
	}

	localReason.value = {
		reasonFor: `to demote ${user.username}`,
		continue: async (reason) => reasonDemote(user, reason),
	};
};

const reasonDemote = async (
	user: FilteredUsers,
	reason: string | undefined
) => {
	if (!reason) {
		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value?.addError(`Need a reason for that.`);
		}

		return;
	}

	const output = await api.Manage.Admin.demoteAdmin(user.id, reason);
	if (!output) {
		console.error("No error");
		console.log(output);
	}

	// Const output = await managementAPI.demoteUserToAdmin(user.id, reason);
	if (output.error ?? !output.success) {
		if (output.error instanceof Error && sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error.message);
		} else if (sne.value && !(output.error instanceof Error)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error ?? "Unknown Error");
		}
	} else if (sne.value) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		sne.value.addSuccess(`Demoted ${user.username}`);
	}

	const index = userList.value?.indexOf(user);
	if (userList.value && index) {
		userList.value[index].role = "user";
	}

	cancelReason();

	if (selectedUser.value) {
		closeUserDialog();
	}

	await loadUsers();
};

// User Info Modal
type UserSelectionTypeText = "User" | "Verifying";
type UserType = FilteredUsers | VerifyingUsers;

type SelectedUser =
	| {
			user: FilteredUsers;
			type: "User";
	  }
	| {
			user: VerifyingUsers;
			type: "Verifying";
	  };

const selectedUser = ref<SelectedUser | undefined>();

const openUserDialog = (
	userid: string,
	type: UserSelectionTypeText
): boolean => {
	let user: UserType | undefined;
	if (type === "User") {
		user = userList.value?.find((user) => user.id === userid);
	} else if (type === "Verifying") {
		user = verifyingUsers.value?.find((user) => user.id === userid);
	}

	if (!user) {
		console.error("No User Found with type", type, "and id", userid);
		return false;
	}

	// @ts-expect-error, We can expect this even though we have properly check and assigned the user
	selectedUser.value = { user, type };
	return true;
};

function canModifyUser(user: FilteredUsers) {
	if (!user) return false;
	if (store.owner && user.role !== "owner") return true;
	if (store.admin && !["owner", "admin"].includes(user.role)) {
		return true;
	}

	return false;
}

const closeUserDialog = () => {
	selectedUser.value = undefined;
};

// Filters
const filters = ["Users", "Verifying Users", "Banned Emails"];
const filter = ref(filters[0]);

// When the filter changes lets do the appropriate calls for the filter

watch(filter, async (value) => {
	if (value === "Users") {
		await loadUsers();
	} else if (value === "Verifying Users") {
		await loadVerifyingUsers();
	}
});

// Users & Verifying Users
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

const verifyingUsers = ref<VerifyingUsers[]>();

const userList = ref<FilteredUsers[]>();

const loadVerifyingUsers = async () => {
	const users = await adminAPI.getVerifyingUsers();

	if (users.success && users.output) {
		verifyingUsers.value = users.output;
	}
};

const loadUsers = async () => {
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
};

async function denyUser(id: string): Promise<boolean | Error> {
	const output = await adminAPI.denyAccount(id);
	if (output.error ?? !output.success) {
		console.log(output.error ?? "Unknown Error");
		if (output.error instanceof Error) {
			if (sne.value) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				sne.value.addError(output.error.message);
			}

			return output.error;
		}

		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error);
		}

		return new Error(output.error ?? "Unknown Error");
	}

	verifyingUsers.value = verifyingUsers.value?.filter(
		(user) => user.id !== id
	);
	if (selectedUser.value) {
		closeUserDialog();
	}

	return true;
}

async function promoteUser(id: string): Promise<boolean | Error> {
	const user = userList.value?.find((user) => user.id === id);
	if (!user) {
		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(`User not found with id ${id}`);
		}

		throw new Error("User Not Found");
	}

	const output = await api.Manage.Admin.promoteUserToAdmin(id);
	if (!output) {
		console.error("No error");
		console.log(output);
	}

	// Const output = await managementAPI.promoteUserToAdmin(id);
	if (output.error ?? !output.success) {
		console.log(output.error ?? "Unknown Error");
		if (output.error instanceof Error) {
			if (sne.value) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				sne.value.addError(output.error.message);
			}

			throw output.error;
		}

		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error);
		}

		throw new Error(output.error ?? "Unknown Error");
	}

	if (sne.value) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		sne.value.addSuccess(`Promoted ${user.username} to Admin`);
	}

	const index = userList.value?.indexOf(user);
	if (userList.value && index) {
		userList.value[index].role = "admin";
	}

	if (selectedUser.value) {
		closeUserDialog();
	}

	return true;
}

async function acceptUser(id: string): Promise<boolean | Error> {
	const output = await adminAPI.acceptAccount(id);
	if (output.error ?? !output.success) {
		console.log(output.error ?? "Unknown Error");
		if (output.error instanceof Error) {
			if (sne.value) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				sne.value.addError(output.error.message);
			}

			return output.error;
		}

		if (sne.value) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			sne.value.addError(output.error);
		}

		return new Error(output.error ?? "Unknown Error");
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

	if (selectedUser.value) {
		closeUserDialog();
	}

	await loadUsers();
	await loadVerifyingUsers();

	console.log(output.output);
	return true;
}

async function deleteUser(
	id: string,
	reason: string
): Promise<boolean | Error> {
	const output = await adminAPI.deleteAccount(id, reason);
	if (output.error ?? !output.success) {
		console.log(output.error ?? "Unknown Error");
		if (output.error instanceof Error) {
			return output.error;
		}

		return new Error(output.error ?? "Unknown Error");
	}

	userList.value = userList.value?.filter((user) => user.id !== id);

	if (selectedUser.value) {
		closeUserDialog();
	}

	await loadUsers();

	if (output.success) {
		console.log(output.output);
		return true;
	}

	return false;
}

const store = useUserStore();

const username = ref(`${store.username}`);

onMounted(async () => {
	if (!username.value) {
		await store.loadUser();
		username.value = store.username ?? "";
	}

	await loadUsers();
	await adminAPI.getBans();
});
</script>
