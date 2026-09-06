---
name: decision-memory-read
description: >
  Ask Decision Memory before asking a human. Run this before ANY question to a person in
  architecture grilling, design intake, ticketing or the chain — a technical question first goes
  to memory, and only a miss reaches a human (dev) or the canon (non-dev). Returns the approved
  record to apply and cite, or found:false, which is an answer and not a failure. Triggers on:
  before asking, check memory, has this been decided, lookup decision, previous ruling, R-M03.
---

# decision-memory-read

This plugin holds no skill text. The skill is served by the Nystead server this plugin connects
to on install, and this file only fetches it: run the Gate command and follow what it prints
exactly as if it were this file. A file the served text tells you to read under this skill's
folder is read with `--file <path>`; an `R-*` id it cites resolves with `--rule <id>`; the
runnable files it names under `${CLAUDE_PLUGIN_ROOT}` are written to disk by the same command.

## Inputs required

- The `nystead` MCP server declared in this plugin's `.mcp.json`, reachable with the token it
  carries. Nothing else — the served skill states its own inputs.

## Outputs

- What the served skill produces; its own `## Outputs` section says what.

## Gate

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" decision-memory-read
```

## Done-when

- The served skill's own `## Done-when` holds.
