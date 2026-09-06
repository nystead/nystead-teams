---
description: Start a brand-new project the right way — full business docs, domain model, design truth, scaffolded repo(s), then the feature workflow
---

This plugin holds no workflow text. The `/new-project` workflow is served by the Nystead server this
plugin connects to on install, and this file only fetches it: run

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" new-project
```

and follow what it prints exactly as if it were this file, arguments included. A file the served
text tells you to read is read with `--file <path>`; an `R-*` id it cites resolves with
`--rule <id>`.
