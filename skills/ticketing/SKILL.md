---
name: ticketing
description: >
  Cut a grilled design record set into the tickets the TDD pipeline and the chain execute —
  three waves, ids `<chain><zone><NN>`, numbered `AC-n` criteria each carrying exactly one
  test clause or one named gate, `Creates:` and `Touches:` instead of a scope line, every
  criterion tracing to the record section that owns it, and `Open: none` because every
  two-way rule was grilled before the file was written. Owns the ticket format, the set
  README, the readiness check, regeneration after a record correction, the followups sweep
  and the chain handoff. Triggers on: tickets, cut tickets, split the record, ticketing,
  backlog, enqueue, what goes in the queue.
---

# ticketing

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" ticketing
```

## Done-when

- The served skill's own `## Done-when` holds.
