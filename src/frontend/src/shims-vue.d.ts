declare module "*.vue" {
	import { DefineComponent } from "vue";

	// biome-ignore lint/complexity/noBannedTypes: standard Vue SFC shim; DefineComponent's generics are typed with {}
	const component: DefineComponent<{}, {}, any>;
	export default component;
}
