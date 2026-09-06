---
name: qa-testing
description: >
  Verify the RUNNING product against the documented truth — docs/business flows and
  BR-numbered rules, feature design records, the design place of truth, and every decision
  Claude made instead of a human — by driving a real browser with Claude in Chrome.
  Flow-by-flow protocol with screenshot evidence, BR-mapped failures, and a QA report that
  feeds the F-loop. Triggers on: qa, test the app, verify flows, check the site, smoke test,
  regression check, walk the flows.
---

# qa-testing

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" qa-testing
```

## Done-when

- The served skill's own `## Done-when` holds.
