---
name: reviewer
description: Read-only code reviewer — runs the frontend/backend-code-review skill on a diff in a clean context. Cannot edit files, so it can never "just fix it"; findings come back as a report. Use for the review phase of every workflow.
tools: Read, Glob, Grep, Bash
---

This plugin holds no agent text. The `reviewer` agent's instructions are served by the Nystead
server this plugin connects to on install: run

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" reviewer
```

and follow what it prints exactly as if it were this file.
