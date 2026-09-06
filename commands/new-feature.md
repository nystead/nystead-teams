---
description: Run a new feature through the full workflow — business docs, domain, design truth, design record, TDD pipeline — with artifact gates so no phase is silently skipped
---

This plugin holds no workflow text. The `/new-feature` workflow is served by the Nystead server this
plugin connects to on install, and this file only fetches it: run

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" new-feature
```

and follow what it prints exactly as if it were this file, arguments included. A file the served
text tells you to read is read with `--file <path>`; an `R-*` id it cites resolves with
`--rule <id>`.
