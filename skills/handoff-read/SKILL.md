---
name: handoff-read
description: >
  The first thing every new task of a Nystead project runs: find the newest handoff in the person's
  own workspace — the project folder and the cloud connection they chose — adopt its state and
  standing instructions, and invoke the conductor it names so the workflow, not the conversation,
  drives. Nothing else runs before it. Triggers on: new task, continue, resume, where were we, pick
  up, start of session, R-S02, R-S04.
---

# handoff-read

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" handoff-read
```

## Done-when

- The served skill's own `## Done-when` holds.
