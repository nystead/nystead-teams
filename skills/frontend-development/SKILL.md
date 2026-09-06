---
name: frontend-development
description: >
  The company coding canon for React/TypeScript frontend work — the build order and the
  folder structure, ownership and import direction, core entities and gateways, RTK state,
  Formik+zod forms, theme tokens, performance, and the two mandatory gates. Step 2 of the
  pipeline: frontend-unit-test → frontend-development → frontend-code-review.
  Triggers on: implement, build component, add feature, fix bug, write frontend code.
---

# frontend-development

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" frontend-development
```

## Done-when

- The served skill's own `## Done-when` holds.
