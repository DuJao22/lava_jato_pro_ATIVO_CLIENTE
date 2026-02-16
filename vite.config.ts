
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 4173,
    host: true,
    // Permite todos os subdomínios do .onrender.com
    allowedHosts: [
      'lava-jato-pro-ativo.onrender.com',
      '.onrender.com'
    ]
  }
});
