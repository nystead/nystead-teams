---
name: backend-code-review
description: >
  Review Node/Express/TypeScript service changes against the backend canon. Graph-first
  global pass, the runnable battery in references/checks.md, a diff-scoped deep read with
  blast radius, test integrity with a mutation probe, security, and contract parity.
  Critical/Major/Minor with one verdict line; gate violations are Critical; findings feed
  the F-loop. Step 3 of the backend pipeline.
  Triggers on: review backend, review api, check service, pre-commit backend review.
---

# backend-code-review

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" backend-code-review
```

## Done-when

- The served skill's own `## Done-when` holds.
