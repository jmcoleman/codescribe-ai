import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true, // Automatically open the report in browser after build
      filename: './dist/stats.html', // Output file location
      gzipSize: true, // Show gzip sizes
      brotliSize: true, // Show brotli sizes
      template: 'treemap', // Use treemap visualization (other options: sunburst, network)
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
