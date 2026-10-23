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
	envDir: '.',
});
