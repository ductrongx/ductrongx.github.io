import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ductrongx.github.io',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
