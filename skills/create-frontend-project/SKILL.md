---
name: create-frontend-project
description: >
  Scaffold a new company frontend project: Vite + react-swc + checker, TypeScript,
  airbnb+prettier eslint (‹redacted› canon), the FRONTEND-METHOD-v2 folder structure,
  RTK, Formik + formik-validator-zod, router v6 lazy, Vitest + Testing Library, and the
  scaffold-shipped checks wired into lint — with a choice of UI library (Joy default /
  Material / antd) and data layer (axios / GraphQL). Runs via the bundled node CLI or by
  Claude applying the same templates.
  Triggers on: new frontend project, scaffold app, create react app, start new UI project.
---

# create-frontend-project

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" create-frontend-project
```

## Done-when

- The served skill's own `## Done-when` holds.
