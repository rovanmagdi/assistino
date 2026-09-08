/**
 * Library build — produces the published package in dist/.
 *
 * Two entries: the components (src/index.ts) and a CSS-only entry whose sole
 * job is to make Tailwind emit dist/style.css. Every runtime dependency stays
 * external, so the consumer's bundler dedupes React and friends against its
 * own copy instead of getting a second one welded into our bundle.
 *
 *     npm run build   →   tsc (types) + this config (js + css)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const externalPackages = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

/** Matches a package name and anything under it ("motion" → "motion/react"). */
const isExternal = (id: string) =>
  externalPackages.some((name) => id === name || id.startsWith(`${name}/`));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    // One stylesheet for the whole library rather than a chunk per import.
    cssCodeSplit: false,
    lib: {
      entry: {
        index: path.resolve(__dirname, "src/index.ts"),
        styles: path.resolve(__dirname, "src/styles.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: isExternal,
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (asset) =>
          asset.names?.some((n) => n.endsWith(".css")) ? "style.css" : "assets/[name][extname]",
      },
    },
  },
});
