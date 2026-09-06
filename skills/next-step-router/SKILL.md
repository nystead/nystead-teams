---
name: next-step-router
description: >
  Decide where the next piece of work goes — /new-feature or /new-fix — from a plain
  description of what someone wants, using three answerable questions instead of a guess about
  size. Use it whenever a person says "what do I do next", "is this a bug or a feature",
  "small change", "just add a column", "can you also…", when a QA report produces a failure,
  when a client asks for something after a ticket set was approved, or any time it is tempting
  to reopen an approved set instead of routing the work properly.
---

# next-step-router

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" next-step-router
```

## Done-when

- The served skill's own `## Done-when` holds.
