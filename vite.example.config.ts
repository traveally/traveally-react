import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Standalone build config for the interactive example app.
// Run:  npm run build:example
// Then open example/index.html in any static server (e.g. VS Code Live Server).
export default defineConfig({
  base: "./",
  root: resolve(__dirname, "example"),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "example"),
    emptyOutDir: false,           // keep demo.tsx + index.html in place
    rollupOptions: {
      input: resolve(__dirname, "example/demo.tsx"),
      output: {
        // Fixed filenames — no content hashes — so index.html can reference them statically
        entryFileNames: "demo.js",
        chunkFileNames: "demo-[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) return "demo.css";
          return assetInfo.name ?? "demo-asset";
        },
      },
    },
  },
});
