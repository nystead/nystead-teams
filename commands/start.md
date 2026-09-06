---
description: Start here — set up what this computer needs, one step at a time and only with permission, then go straight into the project you described
---

This plugin holds no workflow text. The `/start` workflow is served by the Nystead server this
plugin connects to on install, and this file only fetches it: run

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" start
```

and follow what it prints exactly as if it were this file, arguments included. A file the served
text tells you to read is read with `--file <path>`; an `R-*` id it cites resolves with
`--rule <id>`.
