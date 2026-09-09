# @assistino/react-agent-chat

The Assistino ReAct agent's chat UI, packaged as an embeddable React component.
It renders the full ReAct loop (reasoning → tool call → observation → answer) as
a **vertical-rail timeline**, with a pulsing circle marking the tool call that is
currently running and expandable panels showing each tool's arguments and result.

Themed in Talentino blue — the tokens mirror candidate_V1's brand constants
(`src/constants/theme.js`) — with Inter + Space Grotesk and a full dark mode.

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

```tsx
import { AssistinoChat } from "@assistino/react-agent-chat";
import "@assistino/react-agent-chat/style.css";

export function AgentPage() {
  return (
    <div style={{ height: "100vh" }}>
      <AssistinoChat apiBaseUrl="https://engine.example.com" />
    </div>
  );
}
```

The widget fills its parent, so **give the container a height** — it does not
assume the viewport unless you pass `fullScreen`.

Fonts are optional and self-hosted; without them the type stack falls back to
system fonts:

```ts
import "@assistino/react-agent-chat/fonts.css";
```

### Props

Every prop is optional.

| Prop | Default | What it does |
| --- | --- | --- |
| `apiBaseUrl` | `""` (same origin) | Origin of the ReAct backend |
| `apiPath` | `"/v1/chat/completions"` | SSE chat endpoint path |
| `model` | `"react-agent"` | Model id sent with each turn |
| `headers` | — | Extra request headers (e.g. `Authorization`) |
| `credentials` | — | Pass `"include"` to send cookies cross-origin |
| `fetch` | `globalThis.fetch` | Custom fetch (auth refresh, tests) |
| `sessionId` | generated per mount | Pin the conversation to an id you control |
| `title` / `subtitle` | `"ReAct Agent"` / `"Reasoning · Tools · Observation"` | Header text |
| `showHeader` / `showThemeToggle` / `showSettings` | `true` | Hide chrome you don't want |
| `colorTheme` | `"default"` | Brand preset to start from — see [Settings menu](#settings-menu) |
| `nodeStyle` | `"icons"` | Timeline rail markers: `"icons"` or `"dots"` |
| `persistSettings` | `true` | Remember settings-menu choices in localStorage |
| `suggestions` | three sample prompts | Empty-state prompts; `[]` for none |
| `emptyStateTitle` | `"What can I help you with?"` | Empty-state heading |
| `placeholder` | `"Ask the ReAct agent…"` | Composer placeholder (shorthand for `composer.placeholder`) |
| `composer` | — | Restyle/reconfigure the input area — see [The composer](#the-composer) |
| `renderComposer` | — | Replace the input area with your own |
| `theme` | `"inherit"` | `"inherit"` \| `"system"` \| `"light"` \| `"dark"` |
| `tokens` | — | Colors, radius, and fonts to override — see [Theming](#theming) |
| `darkTokens` | — | Overrides applied on top of `tokens` while dark |
| `style` | — | Inline styles on the root element |
| `fullScreen` | `false` | Take the viewport (`h-screen`) instead of the parent box |
| `className` | — | Extra classes on the root element |
| `onMessagesChange` | — | Called with the full transcript as it changes |

### Theming

Nothing about the palette is baked in — every color, radius, and font is a
token you can replace. Pick whichever route suits your app; they compose, with
the `tokens` prop winning over CSS, which wins over the defaults.

**1. The `tokens` prop** — typed, no CSS file needed. A partial set is fine:

```tsx
<AssistinoChat
  tokens={{ primary: "#7C3AED", accent: "#F3E8FF", radius: "0.5rem" }}
  darkTokens={{ primary: "#A78BFA" }}
/>
```

`darkTokens` layers on top of `tokens` only while the widget is dark, so one
component call covers both themes.

**2. CSS on the widget root** — better when the colors already live in your
stylesheet:

```css
.assistino-chat {
  --primary: #7C3AED;
  --radius: 0.5rem;
}
```

**3. Inherit your app's tokens** — point the widget's tokens at your own
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

| Token | Used for |
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

The defaults are Talentino blue, mirroring candidate_V1's brand constants
(`src/constants/theme.js`): `--primary` is `#137FC3` (lifted to `#2E9BDD` in
dark so it stays readable), accents come from `#E5F3FF` / `#076698`, and
`success` / `warning` / `destructive` map to talentinoGreen, a darkened
talentinoDarkerOrange, and talentinoRed.

All of it — tokens and the reset — is scoped to the widget's root element
(`.assistino-chat`), and the stylesheet ships **without** Tailwind preflight,
so embedding it cannot restyle the page around it. Dark mode follows, in
order: an explicit `theme` prop, then a `.dark` ancestor (the usual Tailwind
convention) when `theme="inherit"` — including when your app toggles that class
at runtime.

### Settings menu

The gear button in the header opens a panel where the end user can adjust the
widget without any code on your side:

- **Appearance** — light or dark, overriding the `theme` prop for this user.
- **Brand** — one of the presets in `COLOR_THEMES`: `"default"` (Talentino
  blue), `"pmk"`, `"tendrix"`, or `"talentino AI"`. Each carries a light and a
  dark palette, and some also set radius, fonts, or spacing.
- **Custom theme** — color pickers for `--primary`, `--secondary`, and
  `--accent`, stored per preset and per mode, with a reset.
- **Timeline** — icon circles on the rail, or plain dots.

Choices layer on top of your `tokens` (an explicit pick in the UI beats a host
default) and are applied as inline variables on the widget root, never on
`<html>`. They are remembered in localStorage under `assistino-chat:*` keys;
pass `persistSettings={false}` to keep them per session, or
`showSettings={false}` to hide the menu and pin `colorTheme` / `nodeStyle`
yourself.

### The composer

The input area is customizable at two levels.

**Adjust it** with the `composer` prop — restyle the box, change the behaviour,
add your own controls beside the textarea:

```tsx
<AssistinoChat
  composer={{
    placeholder: "Ask about your pipeline…",
    hint: false,                          // drop the "Enter to send" line
    boxClassName: "rounded-md border-2",  // the bordered box
    textareaClassName: "text-base",       // the <textarea> itself
    minRows: 2,
    maxHeight: 320,                       // how far it auto-grows, in px
    submitOnEnter: false,                 // Enter makes a newline instead
    autoFocus: true,
    leading: <AttachButton />,            // inside the box, before the input
    trailing: <MicButton />,              // between input and send button
    textareaProps: { maxLength: 2000, name: "prompt" },
  }}
/>
```

| Option | What it does |
| --- | --- |
| `placeholder` | Placeholder text |
| `className` / `boxClassName` / `textareaClassName` | Classes on the wrapper, the bordered box, the `<textarea>` |
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

**Replace it** with `renderComposer` when you want your own UI entirely. You get
`send` and `stop`; the transcript above stays as it is:

```tsx
<AssistinoChat
  renderComposer={({ send, stop, streaming }) => (
    <MyComposer onSubmit={send} onCancel={stop} busy={streaming} />
  )}
/>
```

The stock `Composer` is exported too, so a custom shell can still reuse it.

### Composing the parts

`<AssistinoChat />` is the default arrangement of three parts. Use them
directly when the header, transcript, and input need to live in different
places in your layout — a sidebar, a fixed footer, your own toolbar:

```tsx
import { ChatRoot, ChatHeader, ChatBody, ChatInput } from "@assistino/react-agent-chat";

<ChatRoot apiBaseUrl="https://engine.example.com" theme="system">
  <ChatHeader title="Support" subtitle={null}>
    <MyExportButton />           {/* extra controls beside the built-in ones */}
  </ChatHeader>
  <ChatBody suggestions={["Show open roles"]} />
  <ChatInput placeholder="Ask anything…" hint={false} />
</ChatRoot>
```

The same parts hang off the widget as `AssistinoChat.Root`, `.Header`,
`.Body`, and `.Input`.

| Part | Owns | Props |
| --- | --- | --- |
| `ChatRoot` | transcript state, the SSE stream, theme, tokens, settings; renders the `.assistino-chat` root | everything from the props table above except header/body/input options |
| `ChatHeader` | title strip, Clear, theme toggle, settings menu | `title`, `subtitle`, `icon`, `showClear`, `showThemeToggle`, `showSettings`, `children` |
| `ChatBody` | scrolling transcript and the empty state | `suggestions`, `emptyStateTitle`, `emptyStateDescription`, `renderEmptyState` |
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
