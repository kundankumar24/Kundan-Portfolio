import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import { copyFileSync } from 'fs'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development'
  const isProduction = mode === 'production'

  return {
    define: {
      'process.env.GITHUB_USERNAME': JSON.stringify(process.env.GITHUB_USERNAME || null),
      'process.env.GITHUB_TOKEN': JSON.stringify(process.env.GITHUB_TOKEN || null),
      'process.env.LINKEDIN_PROFILE_URL': JSON.stringify(process.env.LINKEDIN_PROFILE_URL || null),
      'process.env.TWITTER_USERNAME': JSON.stringify(process.env.TWITTER_USERNAME || null),
    },
    plugins: [
      // Legacy browser support with polyfills
      legacy({
        targets: ['defaults', 'not IE 11'],
        modernPolyfills: true,
        renderLegacyChunks: true,
      }),
      // Copy service worker and offline page to dist
      {
        name: 'copy-sw',
        closeBundle() {
          try {
            copyFileSync('public/sw.js', 'dist/sw.js')
            copyFileSync('public/offline.html', 'dist/offline.html')
            copyFileSync('public/manifest.json', 'dist/manifest.json')
            console.log('✓ Copied service worker, offline page, and manifest to dist')
          } catch (error) {
            console.error('Failed to copy service worker files:', error)
          }
        },
      },
      // Bundle analyzer (only in production)
      isProduction &&
        visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProduction ? false : true,
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info'],
            },
            format: {
              comments: false,
            },
          }
        : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code
            vendor: ['jspdf'],
            // Split large modules
            animations: [
              './src/js/modules/animation.js',
              './src/js/modules/imageOptimizer.js',
            ],
            social: [
              './src/js/modules/socialMedia.js',
              './src/js/modules/socialSharing.js',
            ],
          },
          // Asset naming for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: assetInfo => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            } else if (/woff2?|ttf|otf|eot/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
      // Asset inlining threshold
      assetsInlineLimit: 4096,
      // CSS code splitting
      cssCodeSplit: true,
      // Report compressed size
      reportCompressedSize: true,
    },
    server: {
      port: 3000,
      open: true,
      cors: true,
      hmr: {
        overlay: true,
      },
    },
    preview: {
      port: 4173,
      open: true,
    },
    css: {
      devSourcemap: isDevelopment,
      postcss: {
        plugins: [],
      },
    },
    publicDir: 'public',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@js': resolve(__dirname, './src/js'),
        '@css': resolve(__dirname, './src/css'),
        '@assets': resolve(__dirname, './src/assets'),
      },
    },
    optimizeDeps: {
      include: ['jspdf'],
      exclude: [],
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },
  }
})