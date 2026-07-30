import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/parroquiama/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/maux-backend_catequesis": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
}));
