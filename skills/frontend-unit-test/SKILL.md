---
name: frontend-unit-test
description: >
  Write unit and component tests FIRST — they are the source of truth. Step 0 of the
  frontend pipeline (frontend-unit-test → frontend-development → frontend-code-review) for
  every chunk, fix and new feature in React/TypeScript repos. Jest + Testing Library canon,
  the request-module mock seam, behaviour-only assertions, one test clause per `AC-n`, and
  the one-time repo bootstrap.
  Triggers on: write tests, unit test, component test, TDD, test first, add coverage.
---

# frontend-unit-test

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" frontend-unit-test
```

## Done-when

- The served skill's own `## Done-when` holds.
