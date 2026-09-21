#!/usr/bin/env node
/* The one script a public Nystead plugin ships. Every skill, command and agent in the plugin is
 * a shell whose Gate runs this; the real text lives on the Nystead server and is served here.
 *
 *   node skill.mjs <name>                  fetch the entry and print its text (session-cached)
 *   node skill.mjs <name> --file <path>    print one text file of the entry (references/…)
 *   node skill.mjs --rule <R-XNN>          print the rule row a cited id resolves to
 *   node skill.mjs --list                  what the server serves
 *   node skill.mjs <name> --fresh          ignore the session cache for this fetch
 *
 * Text is printed and never written; the runnable files (scripts, CLIs, assets) are written under
 * this plugin's root the first time any entry is fetched and again whenever their bundle version
 * moves, so every path a served skill names resolves on disk.
 * The server URL and token come from this plugin's own .mcp.json — nothing to configure.
 *
 * THIS FILE IS THE WRAPPER. The served text and the runnable files are the core, and the core
 * names no coding AI: it says `${NYSTEAD_PLUGIN_ROOT}` for the plugin's root and reads the
 * runner's facts from `<root>/nystead-runtime.env`. This shell is the Claude Code adapter of
 * that contract — it substitutes the root when it prints, and it writes the env file from what
 * it knows about its own runner (the CLI, its headless flags, the build flag in
 * .claude-plugin/build.json). A wrapper for another coding AI replaces this file and nothing
 * else.
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => { const i = args.indexOf(`--${name}`); return i < 0 ? undefined : args[i + 1]; };
const positional = args.filter((a, i) => !a.startsWith('--') && !['--file', '--rule'].includes(args[i - 1]));
const name = positional[0];

const die = (message) => { process.stderr.write(`${message}\n`); process.exit(1); };

const connection = () => {
  const path = join(root, '.mcp.json');
  if (!existsSync(path)) die(`${path} is missing — this plugin cannot reach its server`);
  const servers = JSON.parse(readFileSync(path, 'utf8')).mcpServers ?? {};
  const server = servers.nystead ?? Object.values(servers)[0];
  const url = process.env.DECISION_MEMORY_MCP_URL || process.env.DECISION_MEMORY_URL || server?.url;
  const token = process.env.DECISION_MEMORY_AUTH_TOKEN
    || (server?.headers?.Authorization ?? '').replace(/^Bearer\s+/, '');
  if (!url || !token) die('.mcp.json declares no url or no bearer token for the nystead server');
  return { url, token };
};

const build = () => {
  const path = join(root, '.claude-plugin', 'build.json');
  try { return JSON.parse(readFileSync(path, 'utf8')).build ?? 'dev'; } catch { return 'dev'; }
};

/* The runner contract, written for the core's scripts (chain-init, preflight, question-gate,
 * decision-memory-read) and for anything that runs outside a session, such as a tmux chain that
 * inherits nothing. Every value here is a fact about THIS wrapper's runner; the core only reads. */
const RUNTIME_ENV = 'nystead-runtime.env';
/* Where this session runs -- a fact about the runner's host, so the shell says it and the core only
 * reads it. `orchestrator`: the desktop assistant app that orchestrates and reaches the
 * person's computer through its link. `local`: the coding AI the person started on their own
 * computer, whose shell IS their computer. `remote`: anything else -- a cloud sandbox with no road
 * to their computer, or a plain chat -- which the core moves to the orchestrator. */
const host = () => {
  if (process.env.CLAUDE_CODE_ENTRYPOINT === 'remote_cowork') return 'orchestrator';
  if (process.env.CLAUDECODE === '1' && process.env.CLAUDE_CODE_REMOTE !== 'true') return 'local';
  return 'remote';
};
/* The runner's facts come from the server's `get_runner` — the adapter behind this shell's path
 * knows what this coding AI is and does; the shell hardcodes nothing about itself. A server that
 * predates runners has no such tool, and the values below are what it would have answered. */
const FALLBACK_PROFILE = {
  runner: 'claude-code',
  ai: { cmd: 'claude -p', flags: '--dangerously-skip-permissions --output-format json', modelFlag: '--model' },
};
const writeRuntimeEnv = async () => {
  let profile = FALLBACK_PROFILE;
  try { profile = await call('get_runner', {}); } catch { /* older server */ }
  const q = (v) => `'${String(v ?? '').replace(/'/g, "'\\''")}'`;
  const lines = [
    '# written by the plugin shell on every fetch — the runner facts the core reads; do not edit',
    `NYSTEAD_RUNNER=${profile.runner}`,
    `NYSTEAD_BUILD=${build()}`,
    `NYSTEAD_HOST=${host()}`,
    `NYSTEAD_PLUGIN_ROOT=${root}`,
    `NYSTEAD_AI_CMD=${q(profile.ai?.cmd)}`,
    `NYSTEAD_AI_FLAGS=${q(profile.ai?.flags)}`,
    `NYSTEAD_AI_MODEL_FLAG=${q(profile.ai?.modelFlag)}`,
    '',
  ];
  try { writeFileSync(join(root, RUNTIME_ENV), lines.join('\n')); } catch { /* read-only plugin dir: the core falls back to its defaults */ }
};

/* The core says `${NYSTEAD_PLUGIN_ROOT}`; the person reading the printed text in a Claude Code
 * session needs a path that resolves in a Bash tool call, so the wrapper substitutes it here. */
const adapt = (text) => text.replaceAll('${NYSTEAD_PLUGIN_ROOT}', root).replaceAll('${CLAUDE_PLUGIN_ROOT}', root); // the second is this runner's own name for it, kept for text served before the core went neutral

/* One conversation = one Claude Code process. A Bash tool call is a shell whose parent is that
 * process, so its pid names the conversation; NYSTEAD_SESSION overrides it where that is not so. */
const sessionKey = () => {
  if (process.env.NYSTEAD_SESSION) return process.env.NYSTEAD_SESSION;
  try {
    const grand = execFileSync('ps', ['-o', 'ppid=', '-p', String(process.ppid)], { encoding: 'utf8' }).trim();
    return grand || String(process.ppid);
  } catch { return String(process.ppid); }
};

const cacheFile = () => {
  const dir = join(tmpdir(), `nystead-${userInfo().username}`);
  mkdirSync(dir, { recursive: true });
  return join(dir, `session-${sessionKey()}.json`);
};
const readCache = () => { try { return JSON.parse(readFileSync(cacheFile(), 'utf8')); } catch { return { skills: {} }; } };
const writeCache = (cache) => writeFileSync(cacheFile(), JSON.stringify(cache));

const { url, token } = connection();
const headers = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
  authorization: `Bearer ${token}`,
};

/* A chat session runs in a sandbox whose outbound traffic goes through an allowlist proxy. It is by
 * far the most common reason the server cannot be reached, and it is NOT something the plugin can
 * fix for the person: the allowlist is an application setting, like creating a project. So the shell
 * says what to do here, in the local text, because the skill that would otherwise explain it is
 * itself served from the host that cannot be reached.
 *
 * The proxy refuses in TWO shapes, and both end here. It may refuse the CONNECT, and `fetch` throws.
 * Or it may ANSWER -- a 403 whose body is prose, "Host not in allowlist" -- and `fetch` succeeds: that
 * body then reached `JSON.parse`, and the person was shown `Unexpected token 'H', "Host not i"...`
 * with no word about the setting. An answer that is not the server's JSON is the same refusal. */
const unreachable = (reason) => {
  const host = (() => { try { return new URL(url).host; } catch { return url; } })();
  die(build() === 'nonDev'
    ? [`I can't reach the place where my instructions live (${reason}).`,
      '',
      'This is almost always one setting, and it is one you have to change yourself — I am not',
      'allowed to change settings on your behalf. By default this app may only reach a short list',
      'of addresses, and ours is not on it yet.',
      '',
      'In the app: Settings → Capabilities → Allow network egress → Additional allowed domains.',
      `Paste this address — ${host} — into that box and press Add:`,
      '',
      `    ${host}`,
      '',
      'That is all — you do not have to come back and tell me. I will keep checking and carry on',
      'by myself the moment it goes through. Nothing else changes and nothing is installed;',
      'without it I cannot read my own instructions, so nothing can be built.',
      '',
      '[To the assistant, not the person: do NOT end your turn waiting to be told. Show the block',
      ' above, then re-run this same command about every 15 seconds for up to two minutes. The',
      ' setting takes effect without a restart, so a success means carry straight on with the work.',
      ' Only if it is still refused after that, say so once and ask whether the address was added.]'].join('\n')
    : `the Nystead server at ${url} is unreachable (${reason}) — nothing in this plugin runs without it. `
      + `A sandboxed session refuses every host outside its allowlist: add ${host} under `
      + 'Settings -> Capabilities -> Allow network egress -> Additional allowed domains, or run where egress is open.');
};

const post = async (body) => {
  let response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (error) {
    unreachable(error.cause?.code ?? error.message);
  }
  if (response.status === 401) die('the Nystead server refused the token in this plugin\'s .mcp.json (401) — no skill is served without it');
  if (response.status === 202) return undefined;
  const text = await response.text();
  let json;
  try {
    json = text.startsWith('event:') || text.startsWith('data:')
      ? JSON.parse(text.split('\n').find((line) => line.startsWith('data:')).slice(5))
      : JSON.parse(text);
  } catch {
    /* not the server's voice: a proxy or a gateway answered in its place */
    unreachable(`${response.status} ${text.trim().split('\n')[0].slice(0, 80)}`.trim());
  }
  if (json.error) die(`${json.error.code}: ${json.error.message}`);
  return json.result;
};

const call = async (tool, params) => {
  await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'nystead-shell', version: '0.2.0' } } });
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const result = await post({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: tool, arguments: params } });
  const payload = JSON.parse(result?.content?.[0]?.text ?? '{}');
  if (result?.isError) die(payload.error ?? 'the server refused the call');
  return payload;
};

/* `force` is what --fresh means for the runnable half. The stamp records the version that was
 * written, not that the files are still there: the stamp is written last, so an interrupted write
 * leaves no stamp and repairs itself -- but a file removed AFTER a complete write is never noticed,
 * every later fetch answers `unchanged`, and a skill's own script is simply absent (the scaffold
 * CLI dies with "scaffold check missing from the plugin"). The build guarantees that every path a
 * skill names resolves inside the output; nothing guards that at run time on a user's disk, so
 * --fresh is the remedy: it asks for the bundle again and writes it whole. */
const materialiseRuntime = async (force = false) => {
  const stamp = join(root, '.nystead-runtime');
  const known = force || !existsSync(stamp) ? undefined : readFileSync(stamp, 'utf8').trim();
  const runtime = await call('get_runtime', { build: build(), knownVersion: known });
  if (runtime.unchanged) return;
  runtime.files.forEach((file) => {
    const path = join(root, file.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.content);
    if (/\.(sh|mjs)$/.test(path)) chmodSync(path, 0o755);
  });
  writeFileSync(stamp, `${runtime.version}\n`);
  process.stderr.write(`nystead: ${runtime.files.length} runnable files written under ${root} (runtime ${runtime.version})\n`);
};

/* The server may hold an entry of a kind this runner has no shape for — a slash command reaching a
 * runner that has none. It answers `notEmitted` with the reason, and the shell says so rather than
 * printing an empty text: an absence and a blank fetch must never look the same. */
const notEmitted = (entry, answer) =>
  `\`${entry}\` is a ${answer.kind} and this runner does not take that kind — ${answer.reason}`;

const main = async () => {
  if (flag('list')) {
    const page = await call('list_skills', { page: 1, pageSize: 100 });
    page.items.forEach((item) => process.stdout.write(`${item.kind}\t${item.name}\t${item.version}\n`));
    return;
  }
  if (value('rule')) {
    const rule = await call('get_rule', { id: value('rule') });
    if (!rule.found) die(`${value('rule')} resolves to no rule on the server`);
    const r = rule.row;
    process.stdout.write(`${r.id} — ${r.statement}\n  check: ${r.check}\n  severity: ${r.severity}\n  applies-to: ${r.appliesTo}\n`);
    return;
  }
  if (!name) die('usage: skill.mjs <name> [--file <path>] | --rule <R-XNN> | --list');

  if (value('file')) {
    const file = await call('get_skill', { skill: name, build: build(), file: value('file') });
    if (!file.found) die(`the server does not serve \`${name}\``);
    if (file.notEmitted) die(notEmitted(name, file));
    if (file.fileMissing) die(`\`${name}\` has no text file ${value('file')} — a runnable file is on disk under ${root}`);
    const text = adapt(file.text);
    process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
    return;
  }

  const cache = readCache();
  const known = flag('fresh') ? undefined : cache.skills?.[name];
  const skill = await call('get_skill', { skill: name, build: build(), knownVersion: known });
  if (!skill.found) die(`the server does not serve \`${name}\``);
  if (skill.notEmitted) die(notEmitted(name, skill));
  await materialiseRuntime(flag('fresh'));
  await writeRuntimeEnv();
  if (skill.unchanged) {
    process.stdout.write(`cached: \`${name}\` version ${skill.version} was fetched earlier in this conversation and is unchanged — the text already in the conversation stands (run with --fresh to print it again)\n`);
    return;
  }
  cache.skills = { ...(cache.skills ?? {}), [name]: skill.version };
  writeCache(cache);
  const files = skill.textFiles.length ? ` · text files: ${skill.textFiles.join(', ')} (read with --file)` : '';
  process.stdout.write(`<!-- nystead: ${skill.kind} \`${name}\` version ${skill.version}${files} · host: ${host()} -->\n`);
  const text = adapt(skill.text);
  process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
};

main().catch((error) => die(String(error?.message ?? error)));
