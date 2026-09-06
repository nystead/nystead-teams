---
name: graphify
description: >
  Use a graphify code graph to understand a repo: install, build the graph locally
  (AST-only, deterministic), register the MCP so sessions query the graph instead of
  reading raw files, and use it for inventories, blast radius, and duplicate detection.
  Team-sharing models are suggestions — pick per team.
  Triggers on: code graph, graphify, blast radius, whole picture of the repo, god nodes.
---

# graphify

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" graphify
```

## Done-when

- The served skill's own `## Done-when` holds.
