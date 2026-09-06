---
name: product-docs
description: >
  The very first step of any product or major feature — before domain-modeling, before any
  architecture, before design. Turns what is in the human's head into written business
  documentation under docs/business/ that every later skill reads: vision, users, numbered
  business rules, flows, the glossary seed, what people must SEE and be TOLD, and the MVP split.
  Owns the business interrogation pass (R-B01…R-B09) and the interrogation log.
  Triggers on: start a product, new project docs, business logic, requirements, what is the MVP,
  know everything first.
---

# product-docs

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" product-docs
```

## Done-when

- The served skill's own `## Done-when` holds.
