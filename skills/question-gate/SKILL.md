---
name: question-gate
description: >
  Run this before ANY question reaches a human — when an architecture record is being grilled, at design intake, in business
  documentation, ticketing readiness or the chain. It decides whether the question is a business
  question (the human answers it, in both builds) or a technical one (Decision Memory answers it,
  and in non-dev nobody is asked at all), and it checks the wording of whatever a person is shown.
  Triggers on: ask the human, is this a business question, technical question, before asking,
  question layer, non-dev question, R-G13, technical lexicon.
---

# question-gate

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" question-gate
```

## Done-when

- The served skill's own `## Done-when` holds.
