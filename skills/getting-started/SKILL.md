---
name: getting-started
description: >
  Take a person from a freshly installed plugin to a working environment and the first real
  step of their project — the Claude project, the session instruction, terminal access, and
  each tool the work actually needs — asking permission before every change to their machine
  and saying in one sentence why it is needed. In a `nonDev` build this REPLACES the toolchain
  check every conductor runs, because "install graphify and restart the session" is the wall a
  person who does not write software hits in the first minute. Use it on the first invocation
  of any conductor, whenever a prerequisite turns out to be missing mid-run, when someone says
  "what do I do now", "nothing happens", "it says command not found", "how do I start", or
  when a step needs a session that does not exist yet.
---

# getting-started

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" getting-started
```

## Done-when

- The served skill's own `## Done-when` holds.
