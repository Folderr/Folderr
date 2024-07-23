<template>
	<div class="bg-bg h-full md:h-screen flex flex-col">
		<!-- Maybe different navbar here? Maybe just add login link? -->
    	<FNavbar url='/verify'/>
			<!--- TODO: Put Logic Here --->
    	<FFooter />
  	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as FolderrSDK from "fldrr-web-sdk";

const sdk = FolderrSDK.setup();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const verificationSuccess = ref(false);
const altMessage = ref('');
const error = ref('');
const errorCause = ref();

const verifyAccount = async () => {
	// Verify Plz
	if (
		!route.params.token ||
		!route.params.userid ||
		Array.isArray(route.params.userid) ||
		Array.isArray(route.params.token)
	)
		return;

	const fuckyou = await sdk.Verification.self.verifySelf(route.params.userid, route.params.token)
	if (fuckyou.error) {
		if (fuckyou.error instanceof Error) {
			error.value = fuckyou.error.message;
			errorCause.value = fuckyou.error.cause
		} else {
			error.value = fuckyou.error;
		}
	} else if (fuckyou.success) {
		verificationSuccess.value = true;
	} else {
		altMessage.value = "Something went wrong and I don't know what."
	}
	loading.value = false;
};

onMounted(async () => {
	/*if (
		!route.params.token ||
		!route.params.userid ||
		Array.isArray(route.params.userid) ||
		Array.isArray(route.params.token)
	) {
		await router.push("/404");
	}*/
	await verifyAccount();
	// do verification thingy
});
</script>
