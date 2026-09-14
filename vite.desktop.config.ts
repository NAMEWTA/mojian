import { renameSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

function indexHtml(): Plugin {
  return {
    name: "mojian:desktop-index-html",
    closeBundle() {
      const from = join(root, "dist/desktop.html");
      const to = join(root, "dist/index.html");
      try {
        renameSync(from, to);
      } catch {
        // already named index.html
      }
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), viteReact(), indexHtml()],
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  publicDir: "public",
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: ["es2021", "chrome105", "safari15"],
    rollupOptions: {
      input: fileURLToPath(new URL("./desktop.html", import.meta.url)),
    },
  },
  root,
});
