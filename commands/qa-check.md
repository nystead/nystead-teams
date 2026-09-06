---
description: Verify the running product against the documented flows and BRs through the browser — one feature or the full regression sweep
---

This plugin holds no workflow text. The `/qa-check` workflow is served by the Nystead server this
plugin connects to on install, and this file only fetches it: run

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" qa-check
```

and follow what it prints exactly as if it were this file, arguments included. A file the served
text tells you to read is read with `--file <path>`; an `R-*` id it cites resolves with
`--rule <id>`.
