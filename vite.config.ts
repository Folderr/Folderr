import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	root: './src/frontend',
	build: {
		outDir: '../../dist/src/frontend',
		emptyOutDir: true,
	},
	envDir: '.',
});
