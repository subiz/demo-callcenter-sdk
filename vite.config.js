import {defineConfig} from 'vite'
import commonjs from 'vite-plugin-commonjs'

export default defineConfig({
	plugins: [
		commonjs({
			filter(id) {
				if (id.includes('node_modules/redux-storage/build-es')) {
					return true
				}
			},
		}),
		// Other plugins
	],
	// Other configurations
})
