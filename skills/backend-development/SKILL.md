---
name: backend-development
description: >
  The company backend canon for Node/Express/TypeScript services — clean architecture
  (domain / application / infrastructure), zod request validation, usecase classes,
  repositories with document↔entity mappers, StatusError flow, events and cron modules.
  Step 2 of the backend pipeline: backend-unit-test → backend-development →
  backend-code-review. Triggers on: backend, service, endpoint, usecase, implement api.
---

# backend-development

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" backend-development
```

## Done-when

- The served skill's own `## Done-when` holds.
