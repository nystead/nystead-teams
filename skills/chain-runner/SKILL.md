---
name: chain-runner
description: Set up and run an unattended tmux "chain" that works through a queue of tickets one at a time with Claude Code — writing tests first, implementing, reviewing, and fixing — gated on the project's own lint/typecheck/test command, parking any question it cannot decide for a human with a deadline instead of guessing. Use this whenever someone wants agents to grind through a backlog of tickets overnight or in the background, wants to run several projects' chains in parallel, mentions tmux plus Claude Code, says "run these tickets one after another", "build this while I sleep", "work through the queue", "run it overnight", "unattended", "in the background while I do the next feature", or asks to be notified when a run needs a decision or finishes. Also use it to install the chain into a new repo, to add tickets to a chain that is already running, or to answer or resume a ticket that was deferred.
---

# chain-runner

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
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" chain-runner
```

## Done-when

- The served skill's own `## Done-when` holds.
