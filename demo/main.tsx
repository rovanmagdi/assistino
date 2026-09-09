/**
 * Standalone demo app — `npm run dev` mounts the packaged widget full-screen
 * against a local backend (uvicorn server:app --port 8000, proxied by Vite).
 * It is not part of the published package.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import { ChatRoot, ChatHeader, ChatBody, ChatInput, DefaultEmptyState } from "../src/index";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <ChatRoot fullScreen theme="system">
      <ChatHeader title="ReAct Agent" subtitle="Reasoning · Tools · Observation" showSettings />
      <ChatBody>
        <DefaultEmptyState />
      </ChatBody>
      <ChatInput />
    </ChatRoot>
  </StrictMode>,
);
