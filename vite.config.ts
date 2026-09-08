import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The ReAct backend (uvicorn server:app --port 8000)
const backendTarget = process.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

// Dev/demo config — serves demo/main.tsx against a local backend. The
// published package is built by vite.lib.config.ts instead.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Kept out of dist/, which belongs to the published library build.
  build: { outDir: "dist-demo" },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/v1": { target: backendTarget, changeOrigin: true },
      "/api": { target: backendTarget, changeOrigin: true },
    },
  },
});
