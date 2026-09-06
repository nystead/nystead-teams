---
name: backend-architecture
description: >
  Plan a backend zone before any code: read the business docs and the glossary, then write the
  zone's design record — entities, usecases with their callers, endpoints and DTO contracts,
  events, repositories, migrations, cron — grilled into the record the backend TDD pipeline
  implements. One zone, one set of records; a contract is stated once and referenced everywhere
  else. Triggers on: plan service, new endpoint, backend architecture, api design, service design,
  design record.
---

# backend-architecture

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" backend-architecture
```

## Done-when

- The served skill's own `## Done-when` holds.
