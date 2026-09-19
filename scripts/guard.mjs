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
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/* A conductor was served in this conversation: the fetch printed its header, or the person invoked
 * one by its slash name. Both leave their mark in the transcript, which is the conversation itself,
 * so the guard needs no state of its own and cannot outlive the conversation it guards. */
const CONDUCTOR = /nystead: command [\\]*`|<command-name>\/?nystead-(builder|teams):(nystead|new-project|new-feature|new-fix|qa-check)</;

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

export const conductorServed = (transcript) => CONDUCTOR.test(transcript);

const reason = (what) => [
  `Refused by the Nystead plugin: ${what}.`,
  'A Nystead conductor is running in this conversation, so the product is built only through the workflow,',
  'into the project\'s repository -- never by the host\'s own document, page or app surfaces, whatever the',
  'person\'s words were routed to. Go back to the conductor\'s current step (on /nystead: getting-started,',
  'then /new-project). If the person asked to see something now, say in one line what the workflow will',
  'show them and when, and carry on. Do not reach for another tool to make the same thing.',
].join(' ');

export const decide = (event, transcript) => {
  const what = refusal(event);
  if (!what || !conductorServed(transcript)) return undefined;
  return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason(what) } };
};

const selfTest = () => {
  const served = '{"type":"tool_result","content":"<!-- nystead: command `nystead` version be11 -->"}\n';
  const invoked = '{"message":"<command-name>/nystead-builder:new-project</command-name>"}\n';
  const plain = '{"message":"make me a website"}\n';
  const cases = [
    ['docs batch after /nystead', { tool_name: 'mcp__Claude_Docs__batch', tool_input: {} }, served, true],
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
  ];
  const failed = cases.filter(([, event, transcript, deny]) => Boolean(decide(event, transcript)) !== deny);
  failed.forEach(([label, , , deny]) => process.stderr.write(`FAIL  ${label}: expected ${deny ? 'deny' : 'allow'}\n`));
  /* the whole path once more, through a file, the way the hook actually reads it */
  const dir = mkdtempSync(join(tmpdir(), 'nystead-guard-'));
  const file = join(dir, 't.jsonl');
  writeFileSync(file, served);
  const viaFile = decide({ tool_name: 'mcp__Claude_Docs__batch', transcript_path: file }, readFileSync(file, 'utf8'));
  rmSync(dir, { recursive: true, force: true });
  if (!viaFile) { process.stderr.write('FAIL  transcript read from a file\n'); failed.push(['file']); }
  process.stdout.write(failed.length ? `guard: ${failed.length} of ${cases.length + 1} cases failed\n` : `guard: ${cases.length + 1} cases hold\n`);
  process.exit(failed.length ? 1 : 0);
};

const main = () => {
  if (process.argv.includes('--self-test')) { selfTest(); return; }
  let event;
  try { event = JSON.parse(readFileSync(0, 'utf8')); } catch { return; }
  if (!refusal(event)) return;
  let transcript = '';
  try { transcript = readFileSync(event.transcript_path, 'utf8'); } catch { return; }
  const decision = decide(event, transcript);
  if (decision) process.stdout.write(`${JSON.stringify(decision)}\n`);
};

main();
