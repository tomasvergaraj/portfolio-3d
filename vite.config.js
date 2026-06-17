import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev
export default defineConfig({
  plugins: [react()],
  // Base relativa para que el build funcione tanto en un dominio raíz
  // como en un subdirectorio (p. ej. usuario.github.io/portafolio/).
  base: './',
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Separa las librerías 3D (pesadas y estables) para que el navegador
        // las cachee entre despliegues, aparte del código de la app.
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
        },
      },
    },
  },
})
