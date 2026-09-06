---
name: domain-modeling
description: >
  Build and sharpen a project's domain model after the business docs exist and before any
  architecture record is opened. Owns the one glossary home (docs/domain/glossary.md), its
  mandatory `## Zones` table that ticket ids are drawn from, the invariants each domain carries,
  and the cross-feature ADRs. Use when pinning down domain terminology or a ubiquitous language,
  when splitting the model into domains and zones, when recording an architectural decision, or
  when another skill needs the domain model maintained.
---

# domain-modeling

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" domain-modeling
```

## Done-when

- The served skill's own `## Done-when` holds.
