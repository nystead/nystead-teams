---
name: frontend-architecture
description: >
  The front door for NEW frontend work. Runs after design-truth has derived the pages: fills the
  mandatory route to artboard table, pins the domain terms, references the backend record's
  contract instead of restating it, and writes the zone's design record the TDD pipeline
  implements. One zone, one set of records; the artboard beats the record. Triggers on: new
  feature, new app plan, frontend architecture, design record, plan feature, route table.
---

# frontend-architecture

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" frontend-architecture
```

## Done-when

- The served skill's own `## Done-when` holds.
