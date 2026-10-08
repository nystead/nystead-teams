#!/usr/bin/env node
/* The guard: the one hook a public Nystead plugin ships, for runners that have hooks.
 *
 * The host application this plugin runs in has its own ways of producing a deliverable -- a
 * document surface, published pages and apps with their own database -- and its own guidance that
 * routes a person's words straight to them ("a book" -> a document, "a website" -> an app). Once a
 * Nystead conductor is running in the conversation, the product is built by the workflow and
 * nothing else: the host is the orchestrator that runs the conductor, not a second author. The
 * served text says so; this file is what makes it hold when the host's guidance speaks louder.
 *
 *   PreToolUse hook:   reads the hook event on stdin, prints a deny decision or nothing
 *   node guard.mjs --self-test   runs the cases below and exits 0 when every one holds
 *
 * It never fails closed: an unreadable event or transcript lets the call through, because a guard
 * that breaks the session is worse than the drift it exists to stop.
 *
 * It also refuses, before the call, what R-O01, R-O02 and R-O03 forbid. While the chain's
 * run-ticket.sh has exported NYSTEAD_CHAIN_TICKET, _PHASE, _REPO and _QUESTIONS, a file-tool write
 * inside the repo outside the ticket's Creates:/Touches:, their tests, repo-root files and the
 * questions file is refused; in scan and review, anything but the questions file and the phase's
 * own artifact paths; in implement, any test file; from the shell, git commit, push,
 * checkout and switch. Plugin files and the chain's own scripts are refused in a chain phase and
 * whenever a conductor is served, and so is git push. A shell command's other writes are not parsed:
 * the post-phase diff (R-O02) catches them. That audit (the core's chain-runner audit.mjs) states the
 * same set; scripts/guard-parity.test.mjs runs both on one matrix, so a change here is made there too.
 *
 * Outside a chain the conductor dispatches implementation to the implementer agent and never writes
 * product code itself (R-O01, F-E2). A subagent's hook event names the agent (agent_id, agent_type)
 * but not its task, so the conductor writes .nystead/dispatch.json -- {ticket | scope, phase,
 * questions, repo?} -- at the git root before it spawns the agent, and the implementer's calls get
 * the chain's write set from it; with no dispatch file it may write nothing in the repo. While a
 * conductor is served, a write to product code is refused to every thread and every other agent:
 * product code is any file in a git repository but a repo-root file, a root dot folder, docs/,
 * prompts/fixes/, _fix_reports/, the docs root .workflow.json names, a test file and test support.
 *
 * Every call leaves one line in ~/.nystead/runs/hook-fired.jsonl -- {ts, host, tool, decision},
 * plus the cause when it failed open and, on a call the conductor's rules could refuse, which trace
 * of a conductor the transcript carried (`conductor: header|slash|fetch|none`, `unread` when it could
 * not be read) -- so a host whose hooks never fire shows up as silence in that
 * file instead of looking exactly like a host where everything was allowed. The hook is registered
 * for every tool for the same reason. A refusal carries its rule id. Past 1 MB the file becomes
 * hook-fired.1.jsonl, replacing the older one. A line that cannot be written changes nothing.
 */
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/* A conductor was served in this conversation: the fetch printed its header, the person invoked one
 * by its slash name, or the plugin's stub ran the fetch itself (`scripts/skill.mjs <conductor>`).
 * All three leave their mark in the transcript, which is the conversation itself, so the guard
 * needs no state of its own and cannot outlive the conversation it guards. One marker used to be
 * the whole test, and when it drifted every refusal switched off in silence -- each call logged
 * `allow`, the same line as no conductor at all (F-E3, the class of method rule 184). So any one
 * trace enforces, and every candidate call's line names the trace it matched, `none` included: a
 * drifted header shows up as lines that only the fetch matched. */
const HEADER = /nystead: command [\\]*`/;
const SLASH = /<command-name>\/?nystead-(builder|teams):(nystead|new-project|new-feature|new-fix|qa-check)</;
/* the fetch counts only as a command the session ran -- inside a `"command":"…"` string -- never as
 * a line it read: a file, a result or prose quoting the fetch is not a conductor running */
const FETCH = /"command"\s*:\s*"(?:[^"\\]|\\.)*?scripts[\\/]+skill\.mjs\\*["']?\s+(nystead|new-project|new-feature|new-fix|qa-check)(?![\w-])/;

/* What the host would make the product with. Strict, by ruling: every document write, every
 * published page (a preview or a design canvas included) and the skills that make them. Reading,
 * listing and opening what already exists is never refused. */
const DOCS_WRITE = /^mcp__Claude_Docs__(?!guide$|read$|query$)/;
const HOST_SKILL = /(^|:)(artifact-design|artifact-capabilities|artifact-diagramming|docs|web-artifacts-builder)$/;
const ARTIFACT_READS = ['read', 'list', 'open'];

export const refusal = (event) => {
  const tool = event?.tool_name ?? '';
  const input = event?.tool_input ?? {};
  if (DOCS_WRITE.test(tool)) return 'a document made on the host\'s document surface';
  if (tool === 'Skill' && HOST_SKILL.test(String(input.skill ?? ''))) return `the \`${input.skill}\` skill, which makes a host document or page`;
  if (tool === 'Artifact' && !ARTIFACT_READS.includes(input.action ?? 'publish')) return 'a page or app published on the host';
  if (tool === 'ArtifactData' && !['get', 'list', 'query'].includes(input.action)) return 'a write to a host page\'s database';
  return undefined;
};

export const conductorSignal = (transcript) => {
  const t = String(transcript ?? '');
  if (HEADER.test(t)) return 'header';
  if (SLASH.test(t)) return 'slash';
  if (FETCH.test(t)) return 'fetch';
  return undefined;
};
export const conductorServed = (transcript) => Boolean(conductorSignal(transcript));

/* Where this call runs -- the same rule the shell uses when it writes its runtime facts. */
const host = () => {
  if (process.env.CLAUDE_CODE_ENTRYPOINT === 'remote_cowork') return 'orchestrator';
  if (process.env.CLAUDECODE === '1' && process.env.CLAUDE_CODE_REMOTE !== 'true') return 'local';
  return 'remote';
};

/* Append first: on every call but the first there is nothing else to do. Only a missing folder is
 * created, one level at a time -- a recursive mkdir never returns on a pseudo-filesystem home
 * (/proc), and a hook that hangs is killed with its decision. A home that is not an absolute path
 * would put the log in the project, so it gets no log at all. */
const LOG_CAP = 1024 * 1024;
/* Parallel hooks can all see a full log: each moves it to a name of its own first, and only a file
 * still over the cap becomes the previous one; a racer's fresh short log is put back instead. */
const rotate = (dir, file) => {
  try {
    if (statSync(file).size <= LOG_CAP) return;
    const mine = join(dir, `hook-fired.${process.pid}-${Date.now()}.rot`);
    renameSync(file, mine);
    if (statSync(mine).size > LOG_CAP) { renameSync(mine, join(dir, 'hook-fired.1.jsonl')); return; }
    appendFileSync(file, readFileSync(mine));
    rmSync(mine, { force: true });
  } catch { /* nothing to rotate */ }
};
const record = (tool, decision, extra = {}) => {
  try {
    const home = homedir();
    if (!isAbsolute(home)) return;
    const dir = join(home, '.nystead', 'runs');
    const file = join(dir, 'hook-fired.jsonl');
    const line = `${JSON.stringify({ ts: new Date().toISOString(), host: host(), tool, decision, ...extra })}\n`;
    rotate(dir, file);
    try { appendFileSync(file, line); return; } catch (e) { if (e?.code !== 'ENOENT') return; }
    for (const level of [join(home, '.nystead'), dir]) {
      try { mkdirSync(level); } catch (e) { if (e?.code !== 'EEXIST') return; }
    }
    appendFileSync(file, line);
  } catch { /* the log is a witness, never a gate */ }
};

const reason = (what) => [
  `Refused by the Nystead plugin: ${what}.`,
  'A Nystead conductor is running in this conversation, so the product is built only through the workflow,',
  'into the project\'s repository -- never by the host\'s own document, page or app surfaces, whatever the',
  'person\'s words were routed to. Go back to the conductor\'s current step (on /nystead: getting-started,',
  'then /new-project). If the person asked to see something now, say in one line what the workflow will',
  'show them and when, and carry on. Do not reach for another tool to make the same thing.',
].join(' ');

const FILE_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'];
const inside = (root, p) => { const r = relative(root, p); return r === '' || (r !== '..' && !r.startsWith(`..${sep}`) && !isAbsolute(r)); };
/* The physical path: symlinks resolved through the nearest part that exists, so a repo reached
 * through a link and a link out of the repo are both seen for what they are. */
const physical = (p) => {
  const tail = [];
  let head = resolve(p);
  while (!existsSync(head) && dirname(head) !== head) { tail.unshift(basename(head)); head = dirname(head); }
  try { return join(realpathSync(head), ...tail); } catch { return resolve(p); }
};
const pluginRoot = () => {
  const env = process.env.CLAUDE_PLUGIN_ROOT;
  return physical(env && isAbsolute(env) ? env : dirname(dirname(fileURLToPath(import.meta.url))));
};
const target = (event) => {
  if (!FILE_TOOLS.includes(event?.tool_name)) return undefined;
  const p = event.tool_input?.file_path ?? event.tool_input?.notebook_path;
  if (typeof p !== 'string' || !p) return undefined;
  return physical(resolve(typeof event.cwd === 'string' && isAbsolute(event.cwd) ? event.cwd : process.cwd(), p));
};
const chainFile = (p) => {
  const parts = p.split(sep);
  const rest = parts.slice(parts.lastIndexOf('.chain') + 1);
  if (!parts.includes('.chain')) return false;
  return rest[0] === 'prompts' || (rest.length === 1 && (rest[0].endsWith('.sh') || rest[0] === 'chain.conf'));
};
/* The phases that author no ticket file: their set is their own artifacts (R-O02, Q-F-E4-7). */
const NARROW = ['scan', 'review'];
const isTest = (p) => /\.(test|spec)\./.test(basename(p)) || p.split(sep).includes('__tests__');
const stem = (p) => basename(p).split('.')[0];
/* Folders the unit-test canon keeps tests, mocks and fixtures in: not product code for the conductor
 * (R-O01, notProduct) and step 0's test support in a chain (R-O02). */
const TEST_DIRS = ['test', 'tests', '__tests__', '__mocks__', '__fixtures__', 'fixtures', 'test-utils'];
/* Step 0's test support: those folders and `testing`, where the unit-test bootstrap keeps its setup file
 * and render helper (src/utils/testing/). `testing` is step 0's only -- for the conductor a file there
 * stays product code, as R-O01 lists it (F-E4-24-2 #2). The core's audit.mjs states the same list,
 * pinned by the parity test (Q-F-E4-24). */
const STEP0_SUPPORT = [...TEST_DIRS, 'testing'];
const support = (rel) => rel.split(sep).slice(0, -1).some((seg) => STEP0_SUPPORT.includes(seg));

/* A shell command that commits, pushes or moves the branch. Quoted text is not a git call. */
const GIT = /(^|[;&|(`\s])(?:\S*\/)?git((\s+(-C|-c)\s+\S+)|(\s+--?[\w-]+(=\S+)?))*\s+(commit|push|checkout|switch)(?=$|[\s;&|)`])/;
const QUOTED = /'[^']*'|"(?:\\.|[^"\\])*"/g;
const INNER = /(?:\b(?:ba|z)?sh\s+-c|\beval)\s+(?:'([^']*)'|"((?:\\.|[^"\\])*)")/g;
const gitVerb = (command, verbs) => {
  const raw = String(command ?? '');
  const scripts = [raw.replace(QUOTED, "''"), ...[...raw.matchAll(INNER)].map((m) => (m[1] ?? m[2]).replace(QUOTED, "''"))];
  for (const text of scripts) {
    const m = text.match(GIT);
    if (m && verbs.includes(m[7])) return m[7];
  }
  return undefined;
};

/* A scope line starts with its label; a list marker or bold around the label is read the same, so a
 * fix prompt's `- Creates: a` or `**Creates:** a` is not an empty scope. */
const scopeLine = (l) => l.trim().replace(/^[-*+]\s+/, '').replace(/^\*\*(\w+)(:?)\*\*:?/, '$1:');
const cleanPath = (i) => String(i).replace(/`/g, '').trim().replace(/^\.\//, '').replace(/\/+$/, '');
export const scopeOf = (text) => {
  const list = (label) => text.split('\n').map(scopeLine).filter((l) => l.startsWith(`${label}:`))
    .flatMap((l) => l.slice(label.length + 1).split(','))
    .map(cleanPath)
    .filter((i) => i && !['none', '-', '—'].includes(i.toLowerCase()));
  const records = list('Record').map((i) => i.split(/\s+/)[0]).filter((i) => !i.startsWith('§'));
  return { creates: list('Creates'), touches: list('Touches'), records };
};

const chainEnv = () => {
  const e = process.env;
  const c = { ticket: e.NYSTEAD_CHAIN_TICKET, phase: e.NYSTEAD_CHAIN_PHASE, repo: e.NYSTEAD_CHAIN_REPO, questions: e.NYSTEAD_CHAIN_QUESTIONS };
  if (!Object.values(c).some(Boolean)) return undefined;
  if (!c.phase || ![c.ticket, c.repo, c.questions].every((p) => p && isAbsolute(p))) return { invalid: true };
  const also = String(e.NYSTEAD_CHAIN_ALSO ?? '').split('\n').filter((p) => isAbsolute(p))
    .map((p) => ({ path: physical(p), folder: p.endsWith('/') }));
  return { ...c, repo: physical(c.repo), questions: physical(c.questions), also, answered: e.NYSTEAD_CHAIN_ANSWERED === '1' };
};

const ruled = (rule, text) => ({ rule, text: `Refused by the Nystead plugin (${rule}): ${text}` });
const pluginOrChain = (p) => {
  if (inside(pluginRoot(), p)) return ruled('R-O01', `${p} is a file of the installed plugin. Plugin and chain files are never edited during a run; a change to them goes through /new-fix in the plugin's own repository. Carry on with the current step without it.`);
  if (chainFile(p)) return ruled('R-O01', `${p} is one of the chain's own scripts. Plugin and chain files are never edited during a run; a change to them goes through /new-fix in the plugin's own repository. Carry on with the current step without it.`);
  return undefined;
};

/* Inside a chain phase: the ticket's scope, the tests in implement, git, and the plugin's files. */
export const decideChain = (event, chain, readTicket = (f) => readFileSync(f, 'utf8')) => {
  if (event?.tool_name === 'Bash') {
    const verb = gitVerb(event.tool_input?.command, ['commit', 'push', 'checkout', 'switch']);
    return verb && ruled('R-O03', `\`git ${verb}\` inside a chain phase. The chain never commits, pushes or switches branches: the human owns every commit. Leave the change in the working tree and say so in your report.`);
  }
  const p = target(event);
  if (!p) return undefined;
  const plugin = pluginOrChain(p);
  if (plugin) return plugin;
  if (!inside(chain.repo, p)) return undefined;
  const rel = relative(chain.repo, p);
  let scope;
  try { scope = chain.scope ?? scopeOf(readTicket(chain.ticket)); } catch { return { failOpen: 'ticket' }; }
  const park = `If the ticket cannot be done without it, that is a question, not a decision: park it in ${chain.questions} as a STOP and end the phase (R-C05). Do not make the same change another way.`;
  /* F-E4-7: scan and review author no ticket file -- their set is the questions file, .chain/answers/,
   * the phase's artifact paths and, once a park is answered, the Record: files */
  if (NARROW.includes(chain.phase)) {
    const own = p === chain.questions
      || inside(join(chain.repo, '.chain', 'answers'), p)
      || (chain.also ?? []).some((a) => (a.folder ? inside(a.path, p) : a.path === p))
      || (chain.answered && scope.records.some((r) => resolve(chain.repo, r) === p));
    if (own) return undefined;
    const near = (x) => (inside(chain.repo, x) ? relative(chain.repo, x) : x);
    const list = [near(chain.questions), '.chain/answers/', ...(chain.also ?? []).map((a) => near(a.path) + (a.folder ? '/' : ''))].join(', ');
    const instead = chain.phase === 'review'
      ? 'Write what you would change as a finding in your report; the fix phase applies it.'
      : 'Note what the ticket needs in your scan report; a question goes to the questions file only when the record leaves a decision open, never to get a path.';
    return ruled('R-O02', `${rel}: ${chain.phase} writes no file of the ticket. Its set is ${list}${chain.answered ? ', and the ticket\'s Record: files as the answer says' : ''}. The ticket's tests and repo-root files are written by step0, and its Creates: and Touches: code by implement and fix, which run after this phase: do not write them, do not make the same change another way, and do not park a question to get them. ${instead}`);
  }
  if (chain.phase === 'implement' && isTest(p)) return ruled('R-O02', `${rel} is a test file, and in implement the tests are step 0's: implement until they pass without touching them. ${park}`);
  /* the phase's own files -- the questions file, .chain/answers/, _ALSO and, once a park is answered, the
   * Record: files -- are its set whatever else they are, as the audit reads them (F-E4-24-2 #1) */
  const own = p === chain.questions
    || inside(join(chain.repo, '.chain', 'answers'), p)
    || (chain.also ?? []).some((a) => (a.folder ? inside(a.path, p) : a.path === p))
    || (chain.answered && scope.records.some((r) => resolve(chain.repo, r) === p));
  /* F-E4-24: step 0 writes the tests before the implementation -- of the ticket's Creates: and
   * Touches: paths it keeps only the tests and their test support (R-O02, Q-F-E4-24) */
  if (chain.phase === 'step0' && !own && rel.includes(sep) && !isTest(p) && !support(rel)
    && (scope.creates.some((c) => inside(resolve(chain.repo, c), p)) || scope.touches.some((t) => resolve(chain.repo, t) === p))) {
    return ruled('R-O02', `${rel}: step0 writes the tests, their test support and repo-root files -- not the ticket's implementation: implement writes it after this phase, until the tests step 0 wrote pass. Write no implementation code here, not even a stub: a test that is red because the module does not exist yet is red for the right reason. A test helper goes under a folder named ${STEP0_SUPPORT.join(', ')}.`);
  }
  const touched = scope.touches.map((t) => resolve(chain.repo, t));
  /* a ticket's tests: beside a touched file, or named after a created folder anywhere -- the backend
   * puts an endpoint's suite in src/test/e2e/<controller folder>.test.ts */
  const itsTest = isTest(p) && (touched.some((t) => stem(t) === stem(p)
      && (dirname(p) === dirname(t) || (basename(dirname(p)) === '__tests__' && dirname(dirname(p)) === dirname(t))))
    || scope.creates.some((c) => basename(c) === stem(p)));
  const allowed = !rel.includes(sep)
    || own
    || scope.creates.some((c) => inside(resolve(chain.repo, c), p))
    || touched.includes(p)
    || itsTest;
  if (allowed) return undefined;
  const whose = chain.ticket ? basename(chain.ticket) : 'the dispatched scope';
  if (!scope.creates.length && !scope.touches.length) return ruled('R-O02', `${rel}: ${whose} declares no Creates: or Touches: the guard can read (a line that starts \`Creates: a, b\` / \`Touches: c\`), so nothing in the repository is in scope. ${park}`);
  return ruled('R-O02', `${rel} is outside the Creates: and Touches: of ${whose}. A ticket writes only inside its declared paths and their tests. ${park}`);
};

/* The git repository a path is in: the nearest folder above it that holds .git (a folder, or the
 * file a worktree has). A path in no repository is nobody's product. */
const repoOf = (p) => {
  for (let d = dirname(p); ; d = dirname(d)) {
    if (existsSync(join(d, '.git'))) return d;
    if (dirname(d) === d) return undefined;
  }
};

/* The implementer is the one agent that writes product code. A look-alike name is just another agent. */
export const isImplementer = (event) => Boolean(event?.agent_id) && /(^|:)implementer$/.test(String(event?.agent_type ?? ''));

const DISPATCH = ['.nystead', 'dispatch.json'];
const absolute = (x) => typeof x === 'string' && isAbsolute(x);
const paths = (x) => Array.isArray(x) && x.every((i) => typeof i === 'string');
/* Two shapes (Ivan: "Dispatch-файл", then "Dispatch со scope"): a ticket or fix prompt to read the
 * scope from, or the scope itself for a phase that has no ticket (the UI foundation, the domain).
 * `repo`, absolute and optional, is what the scope's paths are relative to -- an app in a
 * sub-folder of the git root the dispatch lives in. */
export const dispatchOf = (root, read = (f) => readFileSync(f, 'utf8')) => {
  const file = join(root, ...DISPATCH);
  if (!existsSync(file)) return { missing: true };
  try {
    const d = JSON.parse(read(file));
    if (typeof d?.phase !== 'string' || !d.phase || !absolute(d.questions)) return { failOpen: 'dispatch' };
    if (d.repo !== undefined && !absolute(d.repo)) return { failOpen: 'dispatch' };
    const base = { phase: d.phase, repo: d.repo ? physical(d.repo) : root, questions: physical(d.questions), also: [], answered: false };
    if (d.scope !== undefined) {
      if (!paths(d.scope?.creates ?? []) || !paths(d.scope?.touches ?? [])) return { failOpen: 'dispatch' };
      const clean = (l) => (l ?? []).map(cleanPath).filter(Boolean);
      return { ...base, scope: { creates: clean(d.scope.creates), touches: clean(d.scope.touches), records: [] } };
    }
    if (!absolute(d.ticket)) return { failOpen: 'dispatch' };
    return { ...base, ticket: d.ticket };
  } catch { return { failOpen: 'dispatch' }; }
};

/* The repository the session works in: the one its cwd is in. */
const cwdRepo = (event) => (absolute(event?.cwd) ? repoOf(join(physical(event.cwd), '_')) : undefined);
/* The docs root a code repository points at (.workflow.json -> docs), the recommended split layout. */
const docsRootOf = (repo) => {
  try {
    const docs = JSON.parse(readFileSync(join(repo, '.workflow.json'), 'utf8'))?.docs;
    return typeof docs === 'string' && docs ? physical(resolve(repo, docs)) : undefined;
  } catch { return undefined; }
};

const NO_COMMIT = (verb, where) => ruled('R-O03', `\`git ${verb}\` ${where}. The workflow never commits, pushes or switches branches on its own: the human owns every commit. Leave the change in the working tree and say so in your report.`);

/* The implementer's calls: the chain's write set, read from the dispatch the conductor wrote. */
export const decideImplementer = (event, read) => {
  if (event?.tool_name === 'Bash') {
    const verb = gitVerb(event.tool_input?.command, ['commit', 'push', 'checkout', 'switch']);
    return verb && NO_COMMIT(verb, 'from the implementer agent');
  }
  const p = target(event);
  if (!p) return undefined;
  const plugin = pluginOrChain(p);
  if (plugin) return plugin;
  const repo = repoOf(p);
  if (!repo) return undefined;
  /* the dispatch is the target's repository's, or else the one the session works in: the STOP of a
   * split layout goes to a docs repository that holds no dispatch */
  let d = dispatchOf(repo, read);
  const home = cwdRepo(event);
  if (d.missing && home && home !== repo) { const there = dispatchOf(home, read); if (!there.missing) d = there; }
  if (d.failOpen) return d;
  if (d.missing) return ruled('R-O02', `${relative(repo, p)}: the implementer was dispatched with no ${DISPATCH.join('/')} in ${repo}, so it has no declared paths and may write nothing in the repository. Stop and report that the dispatch file is missing; the conductor writes it before it dispatches you.`);
  if (p === d.questions) return undefined;
  if (!inside(d.repo, p)) return ruled('R-O02', `${p} is outside the repository the implementer was dispatched to (${d.repo}). It writes only the dispatched scope and the questions file ${d.questions}; a record or another repository is never amended from implement. Park a STOP instead.`);
  return decideChain(event, d, read);
};

/* Product code, for anyone but the implementer while a conductor is served. Not product: a
 * repo-root file; a root dot folder (.git/ included); the workflow's own root folders -- docs/,
 * the fix prompts (prompts/fixes/) and the review reports (_fix_reports/); the docs root the session's
 * repository points at (.workflow.json, the split layout); a test file; and step 0's test support --
 * anything under a folder the unit-test canon keeps tests, mocks or fixtures in. */
const notProduct = (event, repo, p) => {
  const parts = relative(repo, p).split(sep);
  if (parts.length === 1 || parts[0].startsWith('.')) return true;
  if (parts[0] === 'docs' || parts[0] === '_fix_reports' || (parts[0] === 'prompts' && parts[1] === 'fixes' && parts.length > 2)) return true;
  if (isTest(p) || parts.slice(0, -1).some((seg) => TEST_DIRS.includes(seg))) return true;
  const docs = [cwdRepo(event), repo].filter(Boolean).map(docsRootOf).filter(Boolean);
  return docs.some((root) => inside(root, p));
};
const productCode = (event) => {
  if (isImplementer(event)) return undefined;
  const p = target(event);
  if (!p) return undefined;
  const repo = repoOf(p);
  if (!repo || notProduct(event, repo, p)) return undefined;
  const rel = relative(repo, p);
  return ruled('R-O01', `${rel} is product code, and while a conductor runs, product code is written only by the implementer agent it dispatches. The conductor writes ${DISPATCH.join('/')} (a ticket, or the phase's scope) and dispatches the implementer; it never writes the code itself, and no other agent does either. Go back to the conductor's current step.`);
};

/* With a conductor served (read from the transcript only when the call is a candidate). Inside a
 * chain phase the chain's rules have already decided the paths, so product code is not asked again. */
const conductorCandidate = (event, inChain = false) => {
  const what = refusal(event);
  if (what) return { rule: 'R-O06', text: reason(what) };
  if (event?.tool_name === 'Bash' && gitVerb(event.tool_input?.command, ['push'])) return ruled('R-O03', '`git push`. The AI never pushes: the human does. Say that the commit is ready to push, and carry on.');
  const p = target(event);
  return p ? (pluginOrChain(p) ?? (inChain ? undefined : productCode(event))) : undefined;
};

const deny = (text) => ({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: text } });

export const decide = (event, transcript) => {
  const c = conductorCandidate(event);
  if (!c || !conductorServed(transcript)) return undefined;
  return deny(c.text);
};

const selfTest = () => {
  const failedChain = [];
  const served = '{"type":"tool_result","content":"<!-- nystead: command `nystead` version be11 -->"}\n';
  const invoked = '{"message":"<command-name>/nystead-builder:new-project</command-name>"}\n';
  const plain = '{"message":"make me a website"}\n';
  const cases = [
    ['docs batch after /nystead', { tool_name: 'mcp__Claude_Docs__batch', tool_input: {} }, served, true],
    ['docs batch after the stub fetched a conductor, no header', { tool_name: 'mcp__Claude_Docs__batch', tool_input: {} }, '{"type":"tool_use","input":{"command":"node \\"/p/nystead-builder/scripts/skill.mjs\\" new-fix"}}\n', true],
    ['docs update after /new-project', { tool_name: 'mcp__Claude_Docs__update', tool_input: {} }, invoked, true],
    ['docs read after /nystead', { tool_name: 'mcp__Claude_Docs__read', tool_input: {} }, served, false],
    ['docs guide after /nystead', { tool_name: 'mcp__Claude_Docs__guide', tool_input: {} }, served, false],
    ['app artifact after /nystead', { tool_name: 'Artifact', tool_input: { file_path: 'a.html', capabilities: { db: {} } } }, served, true],
    ['static canvas after /nystead', { tool_name: 'Artifact', tool_input: { file_path: 'canvas.html' } }, served, true],
    ['typed artifact after /nystead', { tool_name: 'Artifact', tool_input: { type_url: 'x', title: 'Recipes' } }, served, true],
    ['artifact open after /nystead', { tool_name: 'Artifact', tool_input: { action: 'open', url: 'x' } }, served, false],
    ['artifact db write after /nystead', { tool_name: 'ArtifactData', tool_input: { action: 'set' } }, served, true],
    ['artifact db read after /nystead', { tool_name: 'ArtifactData', tool_input: { action: 'get' } }, served, false],
    ['artifact read after /nystead', { tool_name: 'Artifact', tool_input: { action: 'read', url: 'x', capabilities: { db: {} } } }, served, false],
    ['capabilities skill after /nystead', { tool_name: 'Skill', tool_input: { skill: 'artifact-capabilities' } }, served, true],
    ['docs skill after /nystead', { tool_name: 'Skill', tool_input: { skill: 'anthropic-skills:docs' } }, served, true],
    ['design skill after /nystead', { tool_name: 'Skill', tool_input: { skill: 'artifact-design' } }, served, true],
    ['a workflow skill after /nystead', { tool_name: 'Skill', tool_input: { skill: 'nystead-builder:new-project' } }, served, false],
    ['docs batch with no conductor', { tool_name: 'mcp__Claude_Docs__batch', tool_input: {} }, plain, false],
    ['app artifact with no conductor', { tool_name: 'Artifact', tool_input: { capabilities: { db: {} } } }, plain, false],
    ['git push after /new-fix', { tool_name: 'Bash', tool_input: { command: 'git push origin main' } }, served, true],
    ['git commit after /new-fix', { tool_name: 'Bash', tool_input: { command: 'git commit -m x' } }, served, false],
    ['quoted git push after /new-fix', { tool_name: 'Bash', tool_input: { command: 'echo "git push"' } }, served, false],
    ['chain script edit after /new-fix', { tool_name: 'Edit', tool_input: { file_path: '/r/.chain/run-ticket.sh' } }, served, true],
    ['chain answer write after /new-fix', { tool_name: 'Write', tool_input: { file_path: '/r/.chain/answers/FR1.md' } }, served, false],
    ['git push with no conductor', { tool_name: 'Bash', tool_input: { command: 'git push' } }, plain, false],
  ];
  const chain = { ticket: '/r/t/T1.md', phase: 'implement', repo: '/r', questions: '/r/t/QUESTIONS.md' };
  const ticket = () => 'Creates: src/a/\nTouches: src/b.ts\n';
  const chainCases = [
    ['chain: inside Creates:', { tool_name: 'Write', tool_input: { file_path: '/r/src/a/x.ts' } }, false],
    ['chain: a Touches: file', { tool_name: 'Edit', tool_input: { file_path: '/r/src/b.ts' } }, false],
    ['chain: outside the scope', { tool_name: 'Edit', tool_input: { file_path: '/r/src/c.ts' } }, true],
    ['chain: a test in implement', { tool_name: 'Write', tool_input: { file_path: '/r/src/a/x.test.ts' } }, true],
    ['chain: a repo-root file', { tool_name: 'Edit', tool_input: { file_path: '/r/package.json' } }, false],
    ['chain: git commit', { tool_name: 'Bash', tool_input: { command: 'git commit -m x' } }, true],
    ['chain: git status', { tool_name: 'Bash', tool_input: { command: 'git status' } }, false],
  ];
  /* F-E2: product code is the implementer's, inside its dispatch */
  const repo = mkdtempSync(join(tmpdir(), 'nystead-guard-repo-'));
  mkdirSync(join(repo, '.git'));
  mkdirSync(join(repo, '.nystead'));
  const t1 = join(repo, 'T1.md');
  writeFileSync(t1, 'Creates: src/a/\n');
  writeFileSync(join(repo, '.nystead', 'dispatch.json'), JSON.stringify({ ticket: t1, phase: 'implement', questions: join(repo, 'Q.md') }));
  const impl = (file) => ({ tool_name: 'Write', agent_id: 'a', agent_type: 'nystead-builder:implementer', tool_input: { file_path: join(repo, ...file) } });
  const productCases = [
    ['product write by the conductor after /new-fix', decide({ tool_name: 'Write', tool_input: { file_path: join(repo, 'src', 'a', 'x.ts') } }, served), true],
    ['implementer inside its dispatch', decideImplementer(impl(['src', 'a', 'x.ts'])), false],
    ['implementer outside its dispatch', decideImplementer(impl(['src', 'b.ts'])), true],
  ];
  rmSync(repo, { recursive: true, force: true });
  productCases.forEach(([label, got, want]) => {
    if (Boolean(got?.rule || got?.hookSpecificOutput) !== want) { process.stderr.write(`FAIL  ${label}: expected ${want ? 'deny' : 'allow'}\n`); failedChain.push([label]); }
  });
  chainCases.forEach(([label, event, want]) => {
    const got = decideChain(event, chain, ticket);
    if (Boolean(got?.rule) !== want) { process.stderr.write(`FAIL  ${label}: expected ${want ? 'deny' : 'allow'}\n`); failedChain.push([label]); }
  });
  const failed = cases.filter(([, event, transcript, deny]) => Boolean(decide(event, transcript)) !== deny);
  failed.forEach(([label, , , deny]) => process.stderr.write(`FAIL  ${label}: expected ${deny ? 'deny' : 'allow'}\n`));
  failed.push(...failedChain);
  /* the whole path once more, through a file, the way the hook actually reads it */
  const dir = mkdtempSync(join(tmpdir(), 'nystead-guard-'));
  const file = join(dir, 't.jsonl');
  writeFileSync(file, served);
  const viaFile = decide({ tool_name: 'mcp__Claude_Docs__batch', transcript_path: file }, readFileSync(file, 'utf8'));
  rmSync(dir, { recursive: true, force: true });
  if (!viaFile) { process.stderr.write('FAIL  transcript read from a file\n'); failed.push(['file']); }
  const total = cases.length + chainCases.length + productCases.length + 1;
  process.stdout.write(failed.length ? `guard: ${failed.length} of ${total} cases failed\n` : `guard: ${total} cases hold\n`);
  process.exit(failed.length ? 1 : 0);
};

const refuse = (tool, r, extra = {}) => { process.stdout.write(`${JSON.stringify(deny(r.text))}\n`); record(tool, 'deny', { rule: r.rule, ...extra }); };

const main = () => {
  if (process.argv.includes('--self-test')) { selfTest(); return; }
  let event;
  try { event = JSON.parse(readFileSync(0, 'utf8')); } catch { record('', 'fail-open', { cause: 'event' }); return; }
  const tool = String(event?.tool_name ?? '');
  const chain = chainEnv();
  /* a chain variable set without the rest: the chain rules cannot apply, the conductor's still do */
  const partial = chain?.invalid ? { cause: 'chain-env' } : undefined;
  if (chain && !partial) {
    let v;
    try { v = decideChain(event, chain); } catch { v = { failOpen: 'guard' }; }
    if (v?.failOpen) { record(tool, 'fail-open', { cause: v.failOpen }); return; }
    if (v) { refuse(tool, v); return; }
  }
  if ((!chain || partial) && isImplementer(event)) {
    let v;
    try { v = decideImplementer(event); } catch { v = { failOpen: 'guard' }; }
    if (v?.failOpen) { record(tool, 'fail-open', { cause: v.failOpen }); return; }
    if (v) { refuse(tool, v); return; }
  }
  const allow = (extra = {}) => (partial ? record(tool, 'fail-open', { ...partial, ...extra }) : record(tool, 'allow', extra));
  const candidate = conductorCandidate(event, Boolean(chain && !partial));
  if (!candidate) { allow(); return; }
  let transcript = '';
  try { transcript = readFileSync(event.transcript_path, 'utf8'); } catch { record(tool, 'fail-open', { cause: 'transcript', conductor: 'unread' }); return; }
  const conductor = conductorSignal(transcript);
  if (conductor) refuse(tool, candidate, { ...partial, conductor }); else allow({ conductor: 'none' });
};

main();
