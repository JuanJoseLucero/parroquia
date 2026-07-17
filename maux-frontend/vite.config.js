import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/oratorio/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/maux-backend": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
}));
