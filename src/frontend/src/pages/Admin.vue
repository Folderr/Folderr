<template>
		<div class="bg-bg h-screen flex flex-col">
			<NavbarAuthenticated :username="username" :admin="true"/>
			<aside class="w-64 flex flex-col grow" aria-label="Sidebar">
				<div class="overflow-y-auto py-4 px-3 bg-secondary-bg flex flex-col grow sticky">
					<ul class="space-y-2 w-full">
						<li>
							<a href="/admin" class="flex text-white font-bold text-lg hover:text-secondary-bg hover:bg-brand-darkened rounded p-2">Service Stats</a>
							<ul class="ml-2 mt-2 text-secondary-text w-full">
								<li>
									<a href="/admin#Verified" class="flex hover:text-text hover:bg-bg rounded p-2">Verfied Users</a>
								</li>
								<li>
									<a href="/admin#Pending" class="flex hover:text-text hover:bg-bg rounded p-2">Pending Users</a>
								</li>
								<li>
									<a href="/admin#Files" class="flex hover:text-text hover:bg-bg rounded p-2">Files Hosted</a>
								</li>
								<li>
									<a href="/admin#Links" class="flex hover:text-text hover:bg-bg rounded p-2">Links Shortened</a>
								</li>
								<li>
									<a href="/admin#Banned" class="flex hover:text-text hover:bg-bg rounded p-2">Emails Banned</a>
								</li>
								<li>
									<a href="/admin#Whitelisted" class="flex hover:text-text hover:bg-bg rounded p-2">Emails Whitelisted</a>
								</li>
							</ul>
						</li>
						<li>
							<a href="/admin#Info" class="flex text-white font-bold text-lg hover:text-secondary-bg hover:bg-brand-darkened rounded p-2">Service Info</a>
							<ul class="space-y-2 ml-4 mt-2 text-secondary-text">
								<li>
									<a href="/admin#Release" class="flex hover:text-text hover:bg-bg rounded p-2">Current Release</a>
								</li>
								<li>
									<a href="/admin#Channel" class="flex hover:text-text hover:bg-bg rounded p-2">Release Channel</a>
								</li>
								<li>
									<a href="/admin#Updated" class="flex hover:text-text hover:bg-bg rounded p-2">Last Updated At</a>
								</li>
								<li>
									<a href="/admin#LatestRelease" class="flex hover:text-text hover:bg-bg rounded p-2">Latest Release</a>
								</li>
							</ul>
						</li>
					</ul>
				</div>
			</aside>
		</div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue';
import {useUserStore} from '../stores/user';
import * as adminAPI from '../wrappers/admin-api';
import NavbarAuthenticated from "../components/Navbar-Authenticated.vue";

const store = useUserStore();

const username = ref(`${store.username}`);
if (!username.value) {
	store.loadUser();
}

onMounted(async () => {
	const stats = await adminAPI.getStats();
	console.log(stats);

	console.log('dingus\nL19, Admin.vue');
})
</script>