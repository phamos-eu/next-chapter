import vue from '@vitejs/plugin-vue'
import frappeui from 'frappe-ui/vite'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
	define: {
		__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
	},
	plugins: [
		vue(),
		frappeui({
			frappeProxy: true,
			lucideIcons: true,
			jinjaBootData: true,
			frontendRoute: '/next-chapter',
			buildConfig: {
				outDir: '../next_chapter/public/frontend',
				baseUrl: '/assets/next_chapter/frontend/',
				indexHtmlPath: '../next_chapter/www/next-chapter.html',
				emptyOutDir: true,
				sourcemap: true,
			},
		}),
	],
	server: {
		allowedHosts: true,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'tailwind.config.js': path.resolve(__dirname, 'tailwind.config.js'),
		},
	},
	optimizeDeps: {
		include: [
			'frappe-ui > feather-icons',
			'showdown',
			'tailwind.config.js',
			'engine.io-client',
			'highlight.js/lib/core',
		],
	},
})
