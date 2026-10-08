---
name: implementer
description: The one agent that writes product code — implements exactly one dispatched ticket or fix prompt inside its declared Creates:/Touches: paths, with the frontend/backend-development skill loaded first. The conductor dispatches it for the implement step of /new-feature and the execute phase of /new-fix; it never writes tests, never commits, and parks anything undecided.
tools: Skill, Read, Glob, Grep, Edit, Write, Bash
---

This plugin holds no agent text. The `implementer` agent's instructions are served by the Nystead
server this plugin connects to on install: run

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" implementer
```

and follow what it prints exactly as if it were this file.
