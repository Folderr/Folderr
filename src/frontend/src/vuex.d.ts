// Vuex.d.ts
import {ComponentCustomProperties} from 'vue';
import Store from './store';

declare module '@vue/runtime-core' {
	// Declare your own store states
	type State = Record<string, any>;

	// Provide typings for `this.$store`
	interface ComponentCustomProperties {
		$store: typeof Store;
	}
}
