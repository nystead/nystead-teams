---
name: decision-memory-write
description: >
  Write to Decision Memory — two moments only. (1) In non-dev, when decision-memory-read missed and
  Claude decided a technical question from the canon: record it in the pending queue with the
  question as asked, the options, the choice, the reason and the artefact, and continue. (2) At
  review, when the human approves or amends pending entries into memory. Triggers on: record
  decision, pending queue, source: claude, approve decision, review pending, R-M07, R-M02.
---

# decision-memory-write

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" decision-memory-write
```

## Done-when

- The served skill's own `## Done-when` holds.
