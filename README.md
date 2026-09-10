# @assistino/react-agent-chat

The Assistino ReAct agent's chat UI, packaged as an embeddable React component.
It renders the full ReAct loop (reasoning → tool call → observation → answer) as
a **vertical-rail timeline**, with a pulsing circle marking the tool call that is
currently running and expandable panels showing each tool's arguments and result.

Themed with the same default palette as Assistino_Engine (emerald primary on
neutral greys) — with Inter + Space Grotesk and a full dark mode.

## Install

The package is not on the public registry; consume it from this repo.

```bash
# from the consuming app
npm install file:../Assistino_Frontend
```

Or, to install a tarball built here:

```bash
# from Assistino_Frontend/
npm pack                     # runs the build, emits assistino-react-agent-chat-0.1.0.tgz
```

`react` and `react-dom` are peer dependencies (18 or 19) — the host app's copies
are used, never a second one bundled in.

## Use

The widget is `ChatRoot` (state, stream, theme) with three parts laid out
inside it: `ChatHeader`, `ChatBody`, and `ChatInput`.

```tsx
import {
  ChatRoot,
  ChatHeader,
  ChatBody,
  ChatInput,
  DefaultEmptyState,
} from "@assistino/react-agent-chat";
import "@assistino/react-agent-chat/style.css";

export function AgentPage() {
  return (
    <div style={{ height: "100vh" }}>
      <ChatRoot apiBaseUrl="https://engine.example.com">
        <ChatHeader title="ReAct Agent" subtitle="Reasoning · Tools · Observation" showSettings />
        <ChatBody>
          <DefaultEmptyState />
        </ChatBody>
        <ChatInput placeholder="Ask anything…" />
      </ChatRoot>
    </div>
  );
}
```

Each part is optional and can sit anywhere inside `ChatRoot` — a sidebar, a
fixed footer, your own toolbar. See [Composing the parts](#composing-the-parts).

The widget fills its parent, so **give the container a height** — it does not
assume the viewport unless you pass `fullScreen`.

Fonts are optional and self-hosted; without them the type stack falls back to
system fonts:

```ts
import "@assistino/react-agent-chat/fonts.css";
```

### `ChatRoot` props

Every prop is optional. Header, empty-state, and input options live on the
parts — see [Composing the parts](#composing-the-parts).

| Prop | Default | What it does |
| --- | --- | --- |
| `apiBaseUrl` | `""` (same origin) | Origin of the ReAct backend |
| `headers` | — | Extra request headers (e.g. `Authorization`) |
| `credentials` | — | Pass `"include"` to send cookies cross-origin |
| `sessionId` | generated per mount | Pin the conversation to an id you control |
| `colorTheme` | `"default"` | Brand preset to start from — see [Settings menu](#settings-menu) |
| `colorThemes` | — | Per-brand overrides on the built-in presets — see [Per-brand themes](#per-brand-themes) |
| `nodeStyle` | `"icons"` | Timeline rail markers: `"icons"` or `"dots"`. Starting value for the settings menu; `<ChatBody nodeStyle />` pins it |
| `persistSettings` | `true` | Remember settings-menu choices in localStorage |
| `theme` | `"inherit"` | `"inherit"` \| `"system"` \| `"light"` \| `"dark"` |
| `fullScreen` | `false` | Take the viewport (`h-screen`) instead of the parent box |
| `className` | — | Extra classes on the root element |
| `onMessagesChange` | — | Called with the full transcript as it changes |
| `children` | — | The parts: `<ChatHeader />`, `<ChatBody />`, `<ChatInput />`, or your own |

### Theming

Nothing about the palette is baked in — every color, radius, and font is a
CSS variable you can replace. Pick whichever route suits your app; they
compose, with your CSS winning over the defaults.

**1. CSS on the widget root** — set the variables where your colors already
live:

```css
.assistino-chat {
  --primary: #7C3AED;
  --radius: 0.5rem;
}
```

**2. Inherit your app's tokens** — point the widget's tokens at your own
variables and it follows your theme switcher for free:

```css
.assistino-chat {
  --primary: var(--brand-500);
  --background: var(--surface);
  --font-sans: var(--app-font);
}
```

Most rebrands only need `primary` (user bubbles, buttons, links, active
states); `accent` and `border` are the next two worth setting.

| Variable | Used for |
| --- | --- |
| `background` / `foreground` | The widget's page and its default text |
| `card` / `cardForeground` | Raised surfaces — composer, code blocks, tool panels |
| `popover` / `popoverForeground` | Overlays |
| `primary` / `primaryForeground` | Brand: user bubbles, buttons, links, active states |
| `primaryBright` | Brand color on the always-dark progress log (never flips by theme) |
| `secondary` / `secondaryForeground` | Secondary surfaces and their text |
| `muted` / `mutedForeground` | Subdued fills; timestamps, hints, captions |
| `accent` / `accentForeground` | Hover and selected states |
| `destructive` / `destructiveForeground` | Errors, failed tool calls, low-confidence badges |
| `success` | Completed tool calls, high-confidence badges |
| `warning` | Warnings, medium confidence, pending actions |
| `border` / `input` / `ring` | Hairlines, input borders, focus ring |
| `radius` | Corner rounding — the smaller radii derive from it |
| `fontSans` / `fontHeading` / `fontMono` | Type stacks |

The defaults mirror Assistino_Engine's `index.css`: `--primary` is
`oklch(0.6929 0.1396 166.55)` (emerald, kept the same in dark), `secondary` /
`accent` are a pale mint, and the surfaces are neutral greys. `success` and
`warning` are the widget's own additions, since the engine has no status tokens.

All of it — variables and the reset — is scoped to the widget's root element
(`.assistino-chat`), and the stylesheet ships **without** Tailwind preflight,
so embedding it cannot restyle the page around it. Dark mode follows, in
order: an explicit `theme` prop, then a `.dark` ancestor (the usual Tailwind
convention) when `theme="inherit"` — including when your app toggles that class
at runtime.

### Settings menu

Opt in with `showSettings` on `<ChatHeader />`. The
gear button in the header then opens a panel where the end user can adjust the
widget without any code on your side:

- **Appearance** — light or dark, overriding the `theme` prop for this user.
- **Brand** — `"default"` (no preset; your CSS on `.assistino-chat` applies) or
  one of the presets in `COLOR_THEMES`: `"assistino"` (the engine palette),
  `"pmk"`, `"tendrix"`, or `"talentino AI"`. Each carries a light and a dark
  palette, and some also set radius, fonts, or spacing.
- **Custom theme** — color pickers for `--primary`, `--secondary`, and
  `--accent`, stored per preset and per mode, with a reset.
- **Timeline** — icon circles on the rail, or plain dots.

Choices layer on top of your CSS (an explicit pick in the UI beats a host
default) and are applied as inline variables on the widget root, never on
`<html>`. They are remembered in localStorage under `assistino-chat:*` keys;
pass `persistSettings={false}` to keep them per session, or
`showSettings={false}` to hide the menu and pin `colorTheme` / `nodeStyle`
yourself.

### Per-brand themes

Each product ships with its own preset, and every preset is fully editable
from the host. Pass `colorThemes` to give a brand a unique look without
restating its whole palette — variables you list replace the built-in ones,
everything else stays:

```tsx
<ChatRoot
  colorTheme="pmk"
  colorThemes={{
    pmk: { light: { "--primary": "#1d4ed8" }, dark: { "--primary": "#60a5fa" } },
    tendrix: { base: { "--radius": "0.4rem" } },
    assistino: { light: { "--accent": "#e0f2ec" } },
    "talentino AI": { base: { "--font-heading": '"Dubai", sans-serif' } },
  }}
>
```

Each entry is a `ThemeDefinition`: `base` (both modes), `light`, and `dark`, each
a map of CSS variables. The brand picker's swatch follows the overridden light
primary, and the end user's **Custom theme** colors still layer on top per
brand and mode. `mergeColorThemes(overrides)` and `colorThemeOptions(themes)`
are exported if you render your own picker.

### The composer

The input area is customizable at two levels.

**Adjust it** with props on `<ChatInput />` — restyle the box, change the
behaviour, add your own controls beside the textarea:

```tsx
<ChatInput
  placeholder="Ask about your pipeline…"
  hint={false}                          // drop the "Enter to send" line
  classNames={{
    box: "rounded-md border-2",         // the bordered box
    textarea: "text-base",              // the <textarea> itself
  }}
  minRows={2}
  maxHeight={320}                       // how far it auto-grows, in px
  submitOnEnter={false}                 // Enter makes a newline instead
  autoFocus
  leading={<AttachButton />}            // inside the box, before the input
  trailing={<MicButton />}              // between input and send button
  textareaProps={{ maxLength: 2000, name: "prompt" }}
/>
```

| Option | What it does |
| --- | --- |
| `placeholder` | Placeholder text |
| `classNames` | `{ root, box, textarea, hint }` — classes on the wrapper, the bordered box, the `<textarea>`, and the hint line |
| `hint` | The line under the input — your own node, or `false` to remove it |
| `minRows` / `maxHeight` | Starting height, and how far it auto-grows before scrolling |
| `autoFocus` | Focus on mount |
| `submitOnEnter` | Default `true`; `false` requires the send button |
| `leading` / `trailing` | Slots inside the box, before the input and after it |
| `renderActions` | Replace the send/stop buttons — gets `{ submit, stop, streaming, value }` |
| `textareaProps` | Raw `<textarea>` attributes: `id`, `name`, `maxLength`, `dir`, `aria-*`, `onFocus`, … |

`textareaProps.className` is merged with the defaults rather than replacing
them, and `onKeyDown` runs before the built-in handler — call
`preventDefault()` there to take over a key.

**Replace it** with the `render` prop when you want your own UI entirely. You
get `send` and `stop`; the transcript above stays as it is:

```tsx
<ChatInput
  render={({ send, stop, streaming }) => (
    <MyComposer onSubmit={send} onCancel={stop} busy={streaming} />
  )}
/>
```

The stock `Composer` is exported too, so a custom shell can still reuse it.

### Composing the parts

The three parts can live anywhere inside `ChatRoot` — a sidebar, a fixed
footer, your own toolbar — and each one is optional:

```tsx
import { ChatRoot, ChatHeader, ChatBody, ChatInput } from "@assistino/react-agent-chat";

<ChatRoot apiBaseUrl="https://engine.example.com" theme="system">
  <ChatHeader actions={<MyExportButton />}>   {/* extra controls beside the built-in ones */}
    <span className="text-lg font-bold">Welcome to Tendrix AI Chat</span>
  </ChatHeader>
  <ChatBody>
    <Welcome />                {/* shown until the first message; nothing by default */}
  </ChatBody>
  <ChatInput placeholder="Ask anything…" hint={false} />
</ChatRoot>
```

| Part | Owns | Props |
| --- | --- | --- |
| `ChatRoot` | transcript state, the SSE stream, theme, settings; renders the `.assistino-chat` root | the [`ChatRoot` props](#chatroot-props) table above |
| `ChatHeader` | title strip, Clear, theme toggle, settings menu | `children` (your content; nothing by default), or `icon` / `title` / `subtitle` for the two-line layout; `actions`, `showClear`, `showThemeToggle`, `showSettings` |
| `ChatBody` | scrolling transcript | `children` — the empty state to show before the first message (nothing by default). `DefaultEmptyState` is a ready-made one: `suggestions`, `title`, `description`, `icon`, and `classNames` (`{ emptyState, title, description, suggestions, suggestion }`). `nodeStyle` — pin the timeline markers to `"icons"` or `"dots"` regardless of the settings menu. `className` |
| `ChatInput` | the composer | every `ComposerOptions` field, plus `render` to replace it |

Anything you render inside `ChatRoot` can call `useChat()` for the transcript
and actions (`messages`, `streaming`, `send`, `stop`, `clear`, `isDark`, …),
so a fully custom part is a few lines:

```tsx
function TurnCounter() {
  const { messages } = useChat();
  return <span>{messages.length} messages</span>;
}
```

### Beyond the widget

The parts are exported too — `streamChat` (the SSE client, no UI),
`AgentTimeline`, `TimelineNode`, `ToolResult`, `Markdown`, `Composer` — so a
different shell can be built around the same stream. See
[`src/index.ts`](src/index.ts) for the full surface.

```ts
import { streamChat } from "@assistino/react-agent-chat";

for await (const evt of streamChat([{ role: "user", content: "hi" }], {
  baseUrl: "https://engine.example.com",
})) {
  console.log(evt.kind, evt);
}
```

## Develop

A standalone demo app ([`demo/main.tsx`](demo/main.tsx)) mounts the widget
full-screen against a local backend. The backend must be running first:

```bash
# from Assistino_Engine/
uvicorn server:app --port 8000
```

Then (requires Node 20.19+ / 22.12+ — e.g. `nvm use 24`):

```bash
# from Assistino_Frontend/
npm install
npm run dev          # http://localhost:5173
```

Vite proxies `/v1` and `/api` to `http://127.0.0.1:8000` (override with
`VITE_BACKEND_URL`).

| Script | Output |
| --- | --- |
| `npm run dev` | demo app with HMR |
| `npm run build` | the package → `dist/` (ESM + `style.css` + `.d.ts`) |
| `npm run build:demo` | the standalone demo app → `dist-demo/` |
| `npm run typecheck` | `tsc` over `src/` and `demo/` |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`); `npm run test:watch` re-runs on change |

## Stack

- React 18/19 + TypeScript + Vite 8 (library build)
- Tailwind CSS v4 (`@tailwindcss/vite`) — compiled into `dist/style.css`, so
  consumers need no Tailwind of their own
- `motion` (timeline animations), `lucide-react` (icons)
- `react-markdown` + `remark-gfm` (answer rendering)
- `plotly.js-dist-min`, dynamically imported only when a chart result arrives

## How it maps the SSE stream

`POST /v1/chat/completions` (stream) → normalized events in
[`src/lib/sse.ts`](src/lib/sse.ts):

| Backend SSE | Timeline node |
| --- | --- |
| `{type:"tool_status", content}` | **Thinking** node (reasoning text) |
| `{type:"tool_start", tool_call_id, tool_name, arguments}` | **Tool** node → `running` (pulsing circle) |
| `{type:"tool_progress", tool_call_id, message}` | appended to that node's **live progress log** (terminal-style) |
| `{type:"tool_end", tool_call_id, result}` | same node → `done`, **rich result** panel filled |
| OpenAI chunk `choices[].delta.content` | **Answer** node (markdown, appended per chunk) |
| `data: [DONE]` | stream ends |

State is assembled into `TimelineStep[]` per assistant message in
[`src/components/chat-page.tsx`](src/components/chat-page.tsx) and rendered by
[`agent-timeline.tsx`](src/components/agent-timeline.tsx) /
[`timeline-node.tsx`](src/components/timeline-node.tsx).

## Rich per-tool result views

Tool results are dispatched by tool name in
[tool-result.tsx](src/components/tools/tool-result.tsx), with all backend
field/name drift absorbed by [tool-results.ts](src/lib/tool-results.ts):

- **web_search** → clickable source chips (favicon + title)
- **assistino_retrieval** → SQL preview + data table
- **linkedin_*** → profile cards (confidence badge, score, match pills)
- **assistino_hr_action** → interactive wizard form (Submit is a stub — no
  backend action endpoint exists yet)
- anything else → plain-text fallback

## Real-time progress

The backend now has a **progress channel**: `BaseTool.progress(msg)` →
`tool_progress` SSE events tagged with the tool call id (see
`tools/base.py`, `agent/loop.py`, `server.py`). The UI appends these to a
terminal-style live log inside the running tool node. web_search, the three
linkedin tools, and retrieval emit progress today; add `self.progress(...)`
to any tool to surface more.

**Still one block, not token-stream:** the final answer and each tool's
*result* still arrive whole (the LLM call doesn't use `stream=True` and tools
return a single string). The UI appends answer text per chunk, so token-level
streaming will light up automatically once the LLM call is switched to
streaming — see `../../FRONTEND_BACKEND_REVIEW.md`.
