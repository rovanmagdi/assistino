# How the assistino frontend visualizes each tool — and how to port it

Notes from reading `assistino_ReAct/frontend/src/components/assistant-ui/tool-ui-*.tsx`
and matching them against what the `ReAct_OPENAI` backend tools actually return.

---

## The shared shell: `ToolFallbackRoot` / `Trigger` / `Content`

Every tool UI is built on the same collapsible primitive
([tool-fallback.tsx](../../../assistino_ReAct/frontend/src/components/assistant-ui/tool-fallback.tsx)):

- **Trigger row** = an icon + a dynamic label + a status indicator + chevron.
  - While `status==="running"` the icon is a spinning loader and the label gets a
    **shimmer** animation.
  - The label is *semantic*, not generic: `Searched "X"`, `12 rows returned`,
    `LinkedIn Person Search`, `Action: Create Position`.
- **Content** = the tool-specific body, auto-**expanded while running** and
  auto-**collapsed once the assistant starts writing its answer** (via
  `useAuiState` watching for text parts).

So the visual contract is: live + open while working → result shown → quietly
folds away when the answer begins. The new frontend's timeline already mirrors
this (running circle + expandable node); these per-tool bodies slot inside it.

Tool UIs are dispatched **by tool name** in
[thread.tsx:668](../../../assistino_ReAct/frontend/src/components/assistant-ui/thread.tsx#L668):

```ts
by_name: {
  web_search: WebSearchToolUI,
  python: PythonToolUI,
  terminal: TerminalToolUI,
  linkedin_search: LinkedInSearchToolUI,
  assistino_action_extract: ActionExtractToolUI,
  assistino_retrieval_query: RetrievalQueryToolUI,
}
```

---

## 1. WebSearch — `tool-ui-web-search.tsx`

**Visual:** Globe icon. Running → "Searching for "…"". Done → results parsed into
a row of **source chips** (favicon + title, each a link). If it was a URL fetch
(`args.url`) the label becomes `Read <domain>`. Falls back to a scrollable `<pre>`
if parsing finds nothing.

**Input format it parses:** plain text blocks separated by `\n---\n`, each with
`Title:`, `URL:`, `Snippet:`.

**Backend match:** ✅ **Exact.** `web_search.py` returns precisely this format and
the tool name `web_search` already matches.

## 2. Retrieve from DB — `tool-ui-retrieval-query.tsx`

**Visual:** Database icon. Running → "Querying database…". Done → label shows
`N rows returned`; body shows a **SQL preview** (`<pre>`), an **error banner** if
any, and a real **HTML `<table>`** (sticky header, hover rows, truncated cells,
"showing X of N", 200-row server cap note).

**Input format it expects:** JSON
`{ tool_kind:"retrieval_query", columns:[], rows:[{}], total_rows, truncated, sql, error }`.

**Backend match:** ⚠️ **Needs a normalizer.** `assistino_retrieval` returns raw
PocketFlow output (shape not guaranteed: may be a JSON list/dict or a plain
"no results" string), and the tool name is `assistino_retrieval`, not
`assistino_retrieval_query`. To reuse this table either (a) reshape the tool's
return to `{columns, rows, total_rows, sql, error}`, or (b) add a small adapter
on the frontend that derives columns/rows from whatever JSON arrives.

## 3. LinkedIn — `tool-ui-linkedin-search.tsx` (the "real-time progress" one)

**Visual, two phases:**
- **Running → live progress log.** It reads `toolStatus` from the Zustand store
  (`useChatRuntimeStore`) and appends every update as a **timestamped line in a
  terminal-style black panel**, auto-scrolling, latest line highlighted blue.
  *This is the "real-time progress" effect you liked.*
- **Done → profile cards.** Each candidate is a clickable card: name, a
  **confidence badge** (color + icon for very_high/high/medium/low), headline,
  📍location, ✉️email, score /100, and **match-reason pills**. Reads `profile` /
  `best_match` / `top_matches` / `top_results` from the result.

**Input it expects:** JSON `{ success, profile|best_match|top_matches|top_results, error }`
with profile fields `profile_url, full_name, headline, location, score, confidence, match_reasons`.

**Backend match:** ⚠️ **Partial + the progress log won't light up.** Two gaps:
1. **Field/name drift.** ReAct has *three* tools (`linkedin_url_scraper`,
   `linkedin_finding_search`, `linkedin_matching_search`) vs one `linkedin_search`.
   `matching_search` returns `top_matches[]` with `profile_url/score/confidence`
   (✅ close) but uses `match_details` not `match_reasons`. `finding_search`
   returns `{total, profiles:[{linkedin_url,...}]}` — keys differ (`profiles`
   vs `top_results`, `linkedin_url` vs `profile_url`).
2. **No live progress.** The terminal log is fed by `tool_status` events emitted
   **during** tool execution. ReAct_OPENAI tools are **synchronous** (`base.py`
   `run()` returns one string; no callback/generator), so no progress is emitted
   while a tool runs — see "Real-time progress" below.

## 4. Actions & Wizards — `tool-ui-action-extract.tsx`

**Visual:** The richest one. Running/error → collapsible with NLG message + error
banner. Ready/missing → an **interactive form rendered inline** (not collapsed):
shadcn `Card`s with `Input`/`Select`/`Textarea`/`Checkbox` fields, required-field
markers, a **Submit** button with validation + toasts. Supports a `wizard[]` of
multiple sub-cards, **repeatable entities** (+/– to add instances), and
**array fields** (+/– to add values).

**Input it expects:** JSON
`{ action, type:"ready"|"missing"|"error", acceptedAttributes[], missingAttributes[], nlg, wizard?[] }`
where each attribute has `name, type, required, renderType, label, enums, isArray`.

**Backend match:** ✅ **Mostly compatible.** `assistino_hr_action` returns
`{action, type, acceptedAttributes, missingAttributes, nlg, ...}` — the form
renders from `accepted`+`missing` so it works without `wizard`. Gaps: tool name
is `assistino_hr_action` (UI keys `assistino_action_extract`), no `tool_kind`/
`wizard` field (fine), and **Submit is a stub** (`handleSubmit` just `console.log`s /
`setTimeout` — there is no backend submit endpoint yet).

---

## Compatibility matrix (ReAct_OPENAI → assistino UI)

| Backend tool (ReAct) | Returns | assistino UI | Reusable? |
| --- | --- | --- | --- |
| `web_search` | text `Title/URL/Snippet ---` | WebSearch (source chips) | ✅ as-is |
| `assistino_hr_action` | JSON action/attrs | ActionExtract (wizard form) | ✅ rename + wire Submit |
| `assistino_retrieval` | raw PocketFlow JSON/text | RetrievalQuery (table) | ⚠️ normalize shape |
| `linkedin_matching_search` | JSON `top_matches[]` | LinkedIn (profile cards) | ⚠️ `match_details`→`match_reasons` |
| `linkedin_finding_search` | JSON `{total,profiles[]}` | LinkedIn (profile cards) | ⚠️ key remap |
| `linkedin_url_scraper` | JSON `{profile{}}` | LinkedIn (single card) | ⚠️ key remap |

---

## Real-time progress: the one real gap

The terminal-style live log (LinkedIn) and the shimmer/"running" states are driven
by events arriving **while a tool runs**. ReAct_OPENAI emits `tool_start` →
(blocks) → `tool_end` with **nothing in between**, because:

- `tools/base.py` `run()` is synchronous and returns a single string.
- `agent/loop.py` runs the tool, then yields `tool_result` in one shot.

To get genuine real-time tool progress, the backend must gain a progress channel:

1. Give `BaseTool.run()` an optional `emit(msg)` callback (or make it a generator
   that `yield`s progress strings).
2. In `agent/loop.py`, pass an `emit` that yields `{"type":"tool_progress",
   "call_id", "message"}` events as they arrive.
3. Map that to an SSE line in `server.py` (`_to_v1_sse`), e.g. reuse
   `tool_status` but tagged with `call_id`.
4. Frontend: append `tool_progress` chunks into the matching timeline node's
   live-log panel (the new equivalent of the Zustand `toolStatus` log).

Until then, the per-tool **result** views (chips, table, profile cards, wizard
form) all work fine — only the *during-run* live log stays a single spinner.

---

## Recommended port into the new frontend

Build one component per tool under `frontend/src/components/tools/`, dispatched by
`step.tool` inside [timeline-node.tsx](src/components/timeline-node.tsx) (replacing
the generic `<pre>` result):

```
tools/
  web-search-result.tsx      → parse Title/URL/Snippet → source chips      (✅ ready)
  retrieval-result.tsx       → normalize → <table>                          (⚠️ adapter)
  linkedin-result.tsx        → profile cards + confidence badges            (⚠️ key map)
  action-wizard.tsx          → interactive form (needs Submit endpoint)     (⚠️ backend)
  tool-result-fallback.tsx   → current <pre> for everything else
```

Add a `normalizeResult(tool, rawString)` helper that JSON-parses and remaps the
field-name drift in one place, so the card/table components stay clean.
