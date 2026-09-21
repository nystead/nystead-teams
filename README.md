# Nystead for Teams (`nystead-teams` 0.8.15)

Nystead for Teams — the gated engineering workflow for people who write software: /new-project, /new-feature, /new-fix and /qa-check over business docs, domain model, design truth, architecture records, ticketing, TDD, review and the unattended chain. The skills are served by the Nystead server the plugin connects to on install; every question the workflow cannot answer from the canon is put to you. Free.

## What is in this plugin

Nothing but shells. Every skill, command and agent here is a stub whose only instruction is to
fetch the real one from the Nystead server and follow it; the server is declared in `.mcp.json`
and connects the moment the plugin is installed. Skills are fetched once per conversation and
again when their version changes on the server, so an update needs no reinstall. The runnable
files the skills use (scripts, CLIs, checks) are written under this plugin's folder on first use.

## Install

```
/plugin marketplace add nystead/nystead-teams
/plugin install nystead-teams@nystead-teams
```

This repository is its own marketplace. Nystead Builder lives in its
own repository the same way.

Nothing to configure.

Check the connection with `/mcp` — `nystead` is listed — and run
`node "${CLAUDE_PLUGIN_ROOT}/scripts/skill.mjs" --list` from any session to see what is served.

You install your own tools; the workflow expects Node, Git and graphify
(`pip3 install "graphifyy[mcp]" --break-system-packages`), tmux for unattended runs, and Docker
with MongoDB/Redis only for a project that stores data. Every conductor checks them and says which
are missing.

## In a sandboxed session: allow one address

A session the desktop assistant app runs in its own sandbox may only reach a short list of
addresses, and the Nystead server is not on it until you add it. Open Settings → Capabilities →
Allow network egress → Additional allowed domains (on an organisation plan the owner does this in
the admin settings), paste the address below and press Add. It takes effect without a restart. A
coding AI started in a terminal on your own computer needs none of this.

```
mcp.nystead.com
```

## Money

**Nystead for Teams is free** — no licence, no seats, no watermark, no expiry. The bearer token
in `.mcp.json` is abuse protection for a free service, not a licence: it keeps the server from
being an open endpoint, and it is the same for every install.

## Where the workflow itself is documented

On the server: run any skill and read what it prints. The canon and the rules it cites are served
too (`--rule R-XNN`); they are not in this repository.
