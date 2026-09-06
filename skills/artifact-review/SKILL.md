---
name: artifact-review
description: >
  Audit a produced ARTEFACT — a design record set, a ticket set, business docs, the design
  place of truth, a QA report — against the rules that own it, and close it in at most two
  rounds. Round 1 issues the findings and FREEZES them; one fix cycle answers all of them;
  round 2 checks closure only and adds nothing; two consecutive reds HALT for a human.
  Use it after any artefact-producing phase and whenever someone says review the record,
  audit the ticket set, check the docs, is this ready, re-review after the fixes, or asks
  why an artefact keeps growing new findings every time it is read.
---

# artifact-review

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" artifact-review
```

## Done-when

- The served skill's own `## Done-when` holds.
