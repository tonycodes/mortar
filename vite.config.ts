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
  build: {
    outDir: "../playground-dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Previews, page templates and Code view source load on demand
        // (React.lazy and import()). The libraries every page needs get their
        // own long-lived chunks, so no single chunk carries the whole app.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id))
            return "react";
          if (
            /node_modules\/(@headlessui|@floating-ui|@react-aria|react-aria|@tanstack|use-sync-external-store)\//.test(
              id,
            )
          )
            return "headlessui";
        },
      },
    },
  },
  server: { port: 4340, strictPort: true },
});
