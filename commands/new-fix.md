---
description: Turn a finding into a gated fix — failing test first, scoped prompt, review — the F-loop entry point
---

This plugin holds no workflow text. The `/new-fix` workflow is served by the Nystead server this
plugin connects to on install, and this file only fetches it: run

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" new-fix
```

and follow what it prints exactly as if it were this file, arguments included. A file the served
text tells you to read is read with `--file <path>`; an `R-*` id it cites resolves with
`--rule <id>`.
