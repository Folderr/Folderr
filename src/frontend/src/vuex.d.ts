// Vuex.d.ts
import Store from './store';

declare module '@vue/runtime-core' {
	// Provide typings for `this.$store`
	interface ComponentCustomProperties {
		$store: typeof Store;
	}
}