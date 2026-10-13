import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  root: "playground",
  plugins: [react(), tailwindcss()],
  build: { outDir: "../playground-dist", emptyOutDir: true },
  server: { port: 4340, strictPort: true },
});
