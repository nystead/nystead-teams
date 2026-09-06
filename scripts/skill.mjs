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
 * moves, so every `${CLAUDE_PLUGIN_ROOT}/skills/…` path a served skill names resolves on disk.
 * The server URL and token come from this plugin's own .mcp.json — nothing to configure.
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
  const url = process.env.DECISION_MEMORY_URL || server?.url;
  const token = process.env.DECISION_MEMORY_AUTH_TOKEN
    || (server?.headers?.Authorization ?? '').replace(/^Bearer\s+/, '');
  if (!url || !token) die('.mcp.json declares no url or no bearer token for the nystead server');
  return { url, token };
};

const build = () => {
  const path = join(root, '.claude-plugin', 'build.json');
  try { return JSON.parse(readFileSync(path, 'utf8')).build ?? 'dev'; } catch { return 'dev'; }
};

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

const post = async (body) => {
  let response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (error) {
    die(`the Nystead server at ${url} is unreachable (${error.cause?.code ?? error.message}) — nothing in this plugin runs without it`);
  }
  if (response.status === 401) die('the Nystead server refused the token in this plugin\'s .mcp.json (401) — no skill is served without it');
  if (response.status === 202) return undefined;
  const text = await response.text();
  const json = text.startsWith('event:') || text.startsWith('data:')
    ? JSON.parse(text.split('\n').find((line) => line.startsWith('data:')).slice(5))
    : JSON.parse(text);
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
    if (file.fileMissing) die(`\`${name}\` has no text file ${value('file')} — a runnable file is on disk under ${root}`);
    process.stdout.write(file.text.endsWith('\n') ? file.text : `${file.text}\n`);
    return;
  }

  const cache = readCache();
  const known = flag('fresh') ? undefined : cache.skills?.[name];
  const skill = await call('get_skill', { skill: name, build: build(), knownVersion: known });
  if (!skill.found) die(`the server does not serve \`${name}\``);
  await materialiseRuntime(flag('fresh'));
  if (skill.unchanged) {
    process.stdout.write(`cached: \`${name}\` version ${skill.version} was fetched earlier in this conversation and is unchanged — the text already in the conversation stands (run with --fresh to print it again)\n`);
    return;
  }
  cache.skills = { ...(cache.skills ?? {}), [name]: skill.version };
  writeCache(cache);
  const files = skill.textFiles.length ? ` · text files: ${skill.textFiles.join(', ')} (read with --file)` : '';
  process.stdout.write(`<!-- nystead: ${skill.kind} \`${name}\` version ${skill.version}${files} -->\n`);
  process.stdout.write(skill.text.endsWith('\n') ? skill.text : `${skill.text}\n`);
};

main().catch((error) => die(String(error?.message ?? error)));
