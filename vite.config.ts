import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/src/index.ts'),
      name: 'StyledTextarea',
      fileName: 'styled-textarea',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['prosemirror-model', 'prosemirror-state', 'prosemirror-view'],
      output: {
        globals: {
          'prosemirror-model': 'ProseMirrorModel',
          'prosemirror-state': 'ProseMirrorState',
          'prosemirror-view': 'ProseMirrorView'
        }
      }
    }
  },
  plugins: [
    dts({
      include: ['src/src/index.ts'],
      outDir: 'dist'
    })
  ]
})
