---
name: backend-unit-test
description: >
  Write backend tests FIRST — they are the source of truth. Step 0 of the backend pipeline
  (backend-unit-test → backend-development → backend-code-review) for every endpoint,
  usecase, entity and fix in Node/Express/TypeScript services. Unit tests at the repository
  seam, supertest e2e per endpoint, one test clause per `AC-n`, red before implementation.
  Triggers on: backend test, api test, usecase test, e2e test, supertest, TDD backend.
---

# backend-unit-test

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" backend-unit-test
```

## Done-when

- The served skill's own `## Done-when` holds.
