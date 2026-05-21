**Overview**

- **Purpose:** Documentation for the MCP agents and how to run, extend, and integrate this project.

**Agents**

- **kagi-translate-mcp:** MCP server exposing three tools over stdio for any MCP-compatible assistant.
  - **Tools provided:** `translate_text`, `translate_url`, `proofread`.
  - **Transport:** stdio (MCP server runs as a subprocess and speaks the MCP protocol on stdout/stdin).

**Files**

- **Entry point:** [src/index.ts](src/index.ts) — reads `KAGI_API_KEY` and starts the server.
- **Server bootstrap:** [src/server.ts](src/server.ts) — creates the `McpServer` and registers tools.
- **Kagi client:** [src/kagi/client.ts](src/kagi/client.ts) — HTTP client that talks to Kagi’s Translate endpoints.
- **Tool registration:** [src/tools/index.ts](src/tools/index.ts) — registers all tools with the MCP server.
- **Tools:**
  - [src/tools/translate.ts](src/tools/translate.ts) — `translate_text` tool (single/batch text translation).
  - [src/tools/translateUrl.ts](src/tools/translateUrl.ts) — `translate_url` tool (translate content at a URL).
  - [src/tools/proofread.ts](src/tools/proofread.ts) — `proofread` tool (proofread / correct text).

**Quickstart**

- **Requirements:** Node.js >= 20, a Kagi API key in `KAGI_API_KEY`.

Install and prepare environment:

```bash
npm install
cp .env.example .env
# set KAGI_API_KEY in .env or export it in your shell
```

Build and run:

```bash
npm run build
npm start
```

For local development with auto-rebuild and restart:

```bash
npm run dev
```

Add to an MCP client (example for Claude Desktop): provide the command `node` and the built entrypoint `dist/index.js` and optionally pass `KAGI_API_KEY` via `env` (see `README.md`).

**How it communicates**

- The server uses `@modelcontextprotocol/sdk` and exposes tools over a `StdioServerTransport`. The process should be started as a subprocess by the MCP client so they communicate over stdin/stdout.

**Extending / Adding Tools**

- Create a new module in `src/tools/` that exports a `registerYourTool(server, client)` function or follow patterns in the existing tool files. Add an import and registration in [src/tools/index.ts](src/tools/index.ts). Rebuild with `npm run build`.

Key steps to add a tool:

- **1.** Add `src/tools/myTool.ts` mirroring existing tools (use Zod schemas, call `server.registerTool`).
- **2.** Import and register it from [src/tools/index.ts](src/tools/index.ts).
- **3.** If the new tool needs new Kagi endpoints, update [src/kagi/types.ts](src/kagi/types.ts) and [src/kagi/client.ts](src/kagi/client.ts).

**Developer notes**

- **Logging:** The code uses `console.error` for error logging; stdout is reserved for MCP protocol traffic.
- **Validation:** Tool inputs are validated using Zod schemas in each tool file.
- **Build:** TypeScript compiles to `dist/` (see `tsconfig.json`).

**Commands & env**

- **Build:** `npm run build`
- **Dev:** `npm run dev`
- **Start (prod):** `npm start` (after `npm run build`)
- **Required env:** `KAGI_API_KEY`

**License**

- This project is licensed under LGPL-2.1-only (see `LICENSE`).

**Testing**

- The following tools have been manually tested and are confirmed working:
  - `translate_text` — text and batch translation.
  - `translate_url` — translation of webpage content fetched from a URL.
  - `proofread` — proofreading and correction.

**Examples**

- Translate text (single):

```json
{ "text": "Hello, world!", "source_lang": "en", "target_lang": "ja" }
```

- Translate URL:

```json
{ "url": "https://example.com/article", "source_lang": "en", "target_lang": "ja" }
```

- Proofread:

```json
{ "text": "Ths is a sentense.", "language": "en" }
```

Responses are returned as MCP tool content blocks with `type: "text"` and the translated/proofread text in the `text` field.
