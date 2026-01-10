
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // Reemplaza process.env.API_KEY con el valor real de la variable de entorno de Render durante el build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});
