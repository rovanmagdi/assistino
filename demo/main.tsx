/**
 * Standalone demo app — `npm run dev` mounts the packaged widget full-screen
 * against a local backend (uvicorn server:app --port 8000, proxied by Vite).
 * It is not part of the published package.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import { AssistinoChat } from "../src/index";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <AssistinoChat fullScreen theme="system" />
  </StrictMode>,
);
