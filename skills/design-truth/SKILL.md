---
name: design-truth
description: >
  Build the place of truth for design BEFORE any architecture: read docs/business/ and
  docs/domain/glossary.md and derive the first markup of every page — the components it must carry
  and the business logic it owns. Then check every design against it: an existing Figma is measured
  against the truth and its gaps named, a missing design is drawn from the truth with Claude Design,
  and a client who dislikes how it looks gets a LOOK change, never a concept change. Anything drawn
  that is in no flow and no rule is a product park. Triggers on: design intake, what pages do we
  need, check the figma, no design yet, page markup, design truth, look vs concept.
---

# design-truth

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" design-truth
```

## Done-when

- The served skill's own `## Done-when` holds.
