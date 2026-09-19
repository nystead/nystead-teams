---
name: handoff-write
description: >
  Write the handoff that lets the next task resume INSIDE the workflow: which conductor was running,
  the phase it stopped at, the skills the next task must load and the exact next command — stored in
  the person's own workspace, never in anyone else's. Every conductor runs it at every phase
  boundary, and getting-started runs it whenever a step needs a new task. The first write asks
  where to keep it when the person has a cloud storage connection; with none it goes to the project
  folder. Triggers on: handoff, end of step, new task, save where we are, pause the work, continue
  tomorrow, R-S01, R-S03, R-S05.
---

# handoff-write

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" handoff-write
```

## Done-when

- The served skill's own `## Done-when` holds.
