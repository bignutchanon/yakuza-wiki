import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' — เสิร์ฟจาก subpath ของ GitHub Pages ได้โดยไม่ต้องผูกชื่อ repo
export default defineConfig({
  base: './',
  plugins: [react()],
})
