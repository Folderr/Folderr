import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [vue(), tailwindcss()],
	root: './src/frontend',
	build: {
		outDir: '../../dist/src/frontend',
		emptyOutDir: true,
	},
	// Relative to root, so this is the repo root: the same folder the dev server in core.ts uses
	envDir: '../..',
});
