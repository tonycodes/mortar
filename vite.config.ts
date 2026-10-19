import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { examplesPlugin } from "./playground/examples.mjs";
export default defineConfig({
  root: "playground",
  plugins: [
    react(),
    tailwindcss(),
    // Code view source, extracted from the fixtures' TypeScript AST at build time.
    examplesPlugin(fileURLToPath(new URL(".", import.meta.url))),
  ],
  build: { outDir: "../playground-dist", emptyOutDir: true },
  server: { port: 4340, strictPort: true },
});
