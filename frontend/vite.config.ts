import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ← ここがポイント：react-window を依存最適化の対象から外す
  optimizeDeps: {
    exclude: ["react-window"],
  },
});
