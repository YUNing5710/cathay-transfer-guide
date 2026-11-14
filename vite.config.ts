import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 开发时把 /api 请求转发到本地后端（backend/，端口 8787）
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8787' } },
});
