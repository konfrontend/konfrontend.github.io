// Script half of the verify State (catalogue/verify.md). Segments the plain-text Letter into Slots by
// the route's template (letter-freelance or letter-employment) and runs every Check marked `by: script`;
// the model Checks, the Fixes, and the cycles are the skill's job. Prints Findings, the Slot map with line
// numbers, the counts, and the brief the model pass reads (Safeguards to look for, `when: job asks` Slots
// present, Profile terms, the Projects' facts, the Answers, the Version sent, the Skills).
// An empty letter.md on the employment route is a resume-only application: nothing to check.
// CLI: node scripts/verify.ts <candidate> [--json]
//   exit 0 when no script Check fails, 1 when one does, 2 on usage or a missing input.
import path from "node:path";
import { readArtifact, loadCatalogue, flagsFor, templateFor, profile, skills, readVersion, versionSkillTerms, AUTOTRIAGE_ROOT, type Profile, type Project } from "./lib.ts";
import { candidateDir, readJob, readLetter, versionFile, versionName } from "./candidate.ts";
import { compute } from "./verdict.ts";

const LIST_LINE = /^(?:-|\d+[.)])\s/;
const NUMBERED = /^\d+[.)]\s/;
const URL_RE = /https?:\/\/[^\s)>\]]+/g;
const ACRONYM = /\b[A-Z][A-Z0-9]{2,}(?=s?\b)/g;
// English and business abbreviations that are not shouting; the Profile, the Projects, and the Job add theirs.
const COMMON_ACRONYMS = ["URL", "API", "CLI", "SDK", "UI", "UX", "CI", "CD", "PDF", "CSV", "HTML", "CSS", "SQL", "HTTP", "HTTPS", "JSON", "XML", "REST", "MVP", "CTO", "CEO", "COO", "CFO", "NDA", "USD", "EUR", "GBP", "CET", "CEST", "PST", "PDT", "EST", "EDT", "UTC", "GMT", "BST", "IST", "AEST", "FAQ", "SEO", "CMS", "CRM", "ERP", "SaaS", "SLA", "SSO", "RBAC", "IAM", "AWS", "GCP", "VPS", "DNS", "TLS", "SSL", "VPN", "SSH", "GDPR", "HIPAA", "PHI", "PII", "BAA", "DPA", "PCI", "FERPA", "COPPA", "CCPA", "WCAG", "SOC", "ISO", "ADR", "PRD", "QA", "IDE", "OAuth", "JWT", "ORM", "NPM", "IOS", "MCP", "LLM", "RAG", "AI", "ML"].map((s) => s.toUpperCase());
const CONTACT_DOMAINS = /\b(?:t\.me|wa\.me|calendly\.com|cal\.com|linkedin\.com|twitter\.com|x\.com|instagram\.com|facebook\.com|discord\.gg|zoom\.us|meet\.google\.com|skype\.com|telegram\.(?:me|org)|whatsapp\.com|signal\.me)\b/i;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const HANDLE = /(?:^|[\s(])@[A-Za-z0-9_]{2,}/;
const PHONE = /(?:\+|\b)\d[\d\s().-]{7,}\d\b/;
const EMOJI = /\p{Extended_Pictographic}/u;
const SELF_WORDS = /\b(?:senior|expert|experienced|seasoned|veteran|lead (?:developer|engineer|dev|architect|front-?end|back-?end|full-?stack))\b/i;
const WE = /\b(we|our|ours|us)\b/gi;
// L5: a run of this many words copied from the posting is a warn; ask headers copy the client's question on purpose.
const COPY_RUN = 6;

type Any = Record<string, any>;
export interface Letter { body: string }
export interface Job { frontmatter: Any | null; body: string }
// The Version sent, as the brief shows it: its name, source, summary and Skills terms, read from its body.
export interface VersionText { name: string; source: string; summary: string | null; skills: string[]; text: string | null }
export interface Answer { slug: string; question: string }
export interface Inputs { candidate: string; letter: Letter; job: Job; profile: Any; skillNames: string[]; voice: Any; projects: Project[]; answers?: Answer[]; version?: VersionText | null }

// The verify Guard has already checked job.md and letter.md; only their absence stops here.
export function loadInputs(candidate: string): Inputs {
  const dir = candidateDir(candidate);
  const job = dir && readJob(dir);
  const letter = dir && readLetter(dir);
  if (!dir || !job || !letter) throw new Error(`private/candidates/${candidate} has no job.md and letter.md; run the verify Guard first`);
  const p = profile();
  const projects = p.projects.filter((x) => !x.errors.length);
  const skillNames = skills(p).map((s) => s.name);
  const version = job.frontmatter?.route === "employment" ? readVersionText(dir, p) : null;
  const answers = p.answers.map((a) => ({ slug: path.basename(a.file, ".md"), question: a.question }));
  return { candidate, letter: { body: letter.body }, job, profile: p.profile ?? {}, skillNames, voice: p.voice ?? {}, projects, answers, version };
}

// The Version the Candidate is sent with (its own version.md, else the general Version): its summary and
// Skills terms, read from the Version body.
export function readVersionText(dir: string, p: Profile): VersionText {
  const name = versionName(dir);
  const source = name === "tailored" ? "version.md in the Candidate folder" : "resume/versions/general.md";
  const v = readVersion(versionFile(dir), p);
  if (v.errors.length) return { name, source, summary: null, skills: [], text: null };
  return { name, source, summary: v.summary || null, skills: versionSkillTerms(v.skills), text: [v.title, v.summary, ...v.skills, ...v.bullets.map((b) => b.text)].join("\n") };
}

function loadCatalogues(route: string) {
  const verify = loadCatalogue("verify") as Any;
  const voiceRules = loadCatalogue("voice") as Any;
  const slots = readArtifact(path.join(AUTOTRIAGE_ROOT, "catalogue", "templates", "letter-slots.md"))!.frontmatter as Any;
  const templateName = templateFor(route);
  const template = readArtifact(path.join(AUTOTRIAGE_ROOT, "catalogue", "templates", `${templateName}.md`))!.frontmatter as Any;
  return { verify, voiceRules, slots, template, templateName };
}

// A catalogue number the script needs; a missing one is a catalogue bug, never a silent default.
function required(value: unknown, key: string): number {
  if (typeof value !== "number") throw new Error(`catalogue value ${key} is missing or not a number`);
  return value;
}
function slotCap(slots: Any, id: string): Any {
  const cap = slots.slots.find((s: Any) => s.id === id)?.cap;
  if (!cap) throw new Error(`catalogue value letter-slots ${id}.cap is missing`);
  return cap;
}

function words(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function isHeader(line: string): boolean {
  if (/https?:\/\//.test(line)) return false;
  return (/:\s*$/.test(line) && words(line) <= 12) || /\?\s*$/.test(line);
}

interface Block { start: number; end: number; lines: string[] }
interface Paragraph { start: number; end: number; lines: string[] }
export interface Slot { id: string; header: string | null; demand: string | null; paragraphs: Paragraph[]; headerLine: number | null; headerMissing?: boolean; text: string }
export interface Segmentation { lines: string[]; blocks: Block[]; slots: Slot[]; greeting: Block | null; errors: string[] }

// Blocks are runs of non-blank lines; line numbers are 1-based within the Letter body.
function toBlocks(body: string): { lines: string[]; blocks: Block[] } {
  const lines = body.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let cur: Block | null = null;
  lines.forEach((raw, i) => {
    if (raw.trim() === "") { cur = null; return; }
    if (!cur) { cur = { start: i + 1, end: i + 1, lines: [] }; blocks.push(cur); }
    cur.end = i + 1;
    cur.lines.push(raw);
  });
  return { lines, blocks };
}

const finish = (slots: Slot[]) => { for (const s of slots) s.text = s.paragraphs.map((p) => p.lines.join("\n")).join("\n\n"); };

// The plan Slot a list reads as when its header is missing or is an ask header: numbered lines are milestones.
const listPlan = (line: string) => (NUMBERED.test(line) ? "milestones" : "deliverables");

// Deterministic segmentation per "Finding Slots in plain text" in catalogue/verify.md.
export function segment(body: string, { headers, planSlots }: { headers: Record<string, string>; planSlots: string[] }): Segmentation {
  const { lines, blocks } = toBlocks(body);
  const errors: string[] = [];
  const slots: Slot[] = [];
  const headerMap = new Map(Object.entries(headers).filter(([, h]) => h).map(([id, h]) => [h.trim().toLowerCase(), id]));
  const push = (slot: Slot) => { slots.push(slot); return slot; };
  const mk = (id: string, block: Block, { header = null as string | null, contentLines = block.lines, start = block.start } = {}): Slot =>
    ({ id, header, demand: null, paragraphs: [{ start, end: block.end, lines: contentLines }], headerLine: header ? block.start : null, text: "" });
  const isPlan = (id: string) => planSlots.includes(id);

  if (blocks.length < 6) {
    errors.push(`too few blocks (${blocks.length}); a Letter has at least greeting, hook, the plan Slot, terms, closing, sign-off`);
    return { lines, blocks, slots, greeting: blocks[0] ?? null, errors };
  }
  const greeting = blocks[0];
  if (greeting.lines.length > 1) errors.push(`block 1 (lines ${greeting.start}-${greeting.end}) is the greeting and must be one line`);
  if (isHeader(greeting.lines[0])) errors.push(`line ${greeting.start} is the greeting and opens with a header`);
  const hookBlock = blocks[1];
  if (isHeader(hookBlock.lines[0])) errors.push(`block 2 (line ${hookBlock.start}) is the hook and opens with a header`);
  push(mk("hook", hookBlock));

  const tail = blocks.slice(-3);
  const middle = blocks.slice(2, -3);
  let current: Slot | null = null;
  for (const b of middle) {
    const first = b.lines[0];
    if (isHeader(first)) {
      const key = first.trim().toLowerCase();
      let id = headerMap.get(key) ?? "answers";
      // an ask header over a list is the plan Slot answering that ask (Slot catalogue, Ask headers)
      if (id === "answers" && b.lines.length > 1 && LIST_LINE.test(b.lines[1]) && !slots.some((s) => isPlan(s.id))) id = listPlan(b.lines[1]);
      if (id !== "answers" && slots.some((s) => s.id === id)) errors.push(`Slot ${id} appears twice (second header on line ${b.start})`);
      if (b.lines.length === 1) errors.push(`header "${first.trim()}" on line ${b.start} has no content under it`);
      const slot = push(mk(id, b, { header: first.trim(), contentLines: b.lines.slice(1), start: b.start + 1 }));
      if (!headerMap.has(key)) slot.demand = first.trim().replace(/[:?]\s*$/, "");
      current = slot;
    } else if (LIST_LINE.test(first)) {
      // a list without its header: the plan Slot lost its header line
      const slot = push(mk(listPlan(first), b));
      slot.headerMissing = true;
      current = slot;
    } else if (!current) {
      errors.push(`block at lines ${b.start}-${b.end} has no header and follows the hook directly`);
    } else {
      // prose after the plan list is the plan block's own prose; prose after any other Slot continues it
      current.paragraphs.push({ start: b.start, end: b.end, lines: b.lines });
    }
  }
  const tailIds = ["terms", "closing", "sign_off"];
  tail.forEach((b, i) => {
    const first = b.lines[0];
    if (isHeader(first)) {
      // terms may carry the availability ask as its header; a catalogue header there is a Slot out of place
      if (i === 0 && !headerMap.has(first.trim().toLowerCase()) && b.lines.length > 1) {
        push(mk("terms", b, { header: first.trim(), contentLines: b.lines.slice(1), start: b.start + 1 }));
        return;
      }
      errors.push(`block at line ${b.start} opens with a header where ${tailIds[i]} is expected`);
    }
    push(mk(tailIds[i], b));
  });
  const signOff = slots.find((s) => s.id === "sign_off");
  if (signOff && signOff.paragraphs[0].lines.length > 1) errors.push(`sign-off (lines ${signOff.paragraphs[0].start}-${signOff.paragraphs[0].end}) must be one line`);
  finish(slots);
  return { lines, blocks, slots, greeting, errors };
}

// The cover letter has no headers, so its Slots are found by position (catalogue/verify.md): greeting,
// intro, relevant_work, then terms when present, closing, sign_off.
export function segmentEmployment(body: string): Segmentation {
  const { lines, blocks } = toBlocks(body);
  const errors: string[] = [];
  const slots: Slot[] = [];
  const mk = (id: string, b: Block): Slot => ({ id, header: null, demand: null, headerLine: null, paragraphs: [{ start: b.start, end: b.end, lines: b.lines }], text: "" });
  if (blocks.length < 5) {
    errors.push(`too few blocks (${blocks.length}); a cover letter has at least greeting, intro, relevant work, closing, sign-off`);
    return { lines, blocks, slots, greeting: blocks[0] ?? null, errors };
  }
  if (blocks.length > 6) errors.push(`too many blocks (${blocks.length}); a cover letter has at most greeting, intro, relevant work, terms, closing, sign-off`);
  const greeting = blocks[0];
  if (greeting.lines.length > 1) errors.push(`block 1 (lines ${greeting.start}-${greeting.end}) is the greeting and must be one line`);
  for (const b of blocks) if (isHeader(b.lines[0]) && b !== greeting) errors.push(`line ${b.start} opens with a header; a cover letter has none`);
  const middle = blocks.slice(2, -2);
  slots.push(mk("intro", blocks[1]));
  middle.slice(0, 2).forEach((b, i) => slots.push(mk(i === 0 ? "relevant_work" : "terms", b)));
  const last = blocks[blocks.length - 1];
  slots.push(mk("closing", blocks[blocks.length - 2]), mk("sign_off", last));
  if (last.lines.length > 1) errors.push(`sign-off (lines ${last.start}-${last.end}) must be one line`);
  finish(slots);
  return { lines, blocks, slots, greeting, errors };
}

function lineOwner(seg: Segmentation): (l: number) => string {
  const owner = new Map<number, string>();
  if (seg.greeting) for (let l = seg.greeting.start; l <= seg.greeting.end; l++) owner.set(l, "greeting");
  for (const s of seg.slots) {
    if (s.headerLine) owner.set(s.headerLine, s.id);
    for (const p of s.paragraphs) for (let l = p.start; l <= p.end; l++) owner.set(l, s.id);
  }
  return (l) => owner.get(l) ?? "?";
}

export interface Finding { id: string; severity: "fail" | "warn"; fix: string; slot: string; detail: string }

function escapeRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function phraseRe(p: string): RegExp {
  const a = /^\w/.test(p) ? "\\b" : "", z = /\w$/.test(p) ? "\\b" : "";
  return new RegExp(`${a}${escapeRe(p)}${z}`, "i");
}
function stripQuotes(line: string): string { return line.replace(/"[^"]*"|“[^”]*”/g, " "); }
const tokens = (text: string): string[] => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

// L5: the runs of COPY_RUN words a line shares with the posting, as the first such run per line.
export function copiedRun(line: string, postingRuns: Set<string>): string | null {
  const t = tokens(line);
  for (let i = 0; i + COPY_RUN <= t.length; i++) {
    const run = t.slice(i, i + COPY_RUN).join(" ");
    if (postingRuns.has(run)) return run;
  }
  return null;
}
export function postingRuns(body: string): Set<string> {
  const t = tokens(body), runs = new Set<string>();
  for (let i = 0; i + COPY_RUN <= t.length; i++) runs.add(t.slice(i, i + COPY_RUN).join(" "));
  return runs;
}

// The Project facts a Letter may cite, harvested from the meta, the Bullets (by key, with the Story
// that holds them) and the Notes: the model's fact table traces every Letter fact to one of these lines.
export function projectFacts(p: Project) {
  const m = p.meta;
  return {
    slug: p.slug, name: m.name, url: m.url ?? null, role: m.role, employment: m.employment,
    period: `${m.start} – ${m.end ?? "present"}`, naming: m.naming, description: m.description ?? null,
    keywords: m.keywords ?? [], bullets: p.bullets.map((b) => ({ key: b.key, story: b.story, text: b.text })), notes: p.notes,
  };
}

export interface Analysis { findings: Finding[]; letter_skipped: boolean; slots: Any[]; counts: Any | null; brief: Any; fails: number; warns: number }

export function analyse({ candidate, letter, job, profile: profileMeta, skillNames = [], voice, projects, answers = [], version = null }: Inputs): Analysis {
  const route: string = job.frontmatter?.route ?? "freelance";
  const employment = route === "employment";
  const cat = loadCatalogues(route);
  const letterCap: Any = cat.template.cap ?? {};
  const checkMeta = new Map<string, Any>((cat.verify.checks as Any[]).map((c) => [c.id, c]));
  const onRoute = (meta: Any) => !meta.routes || meta.routes.includes(route);
  const findings: Finding[] = [];
  // a Check whose routes lack this route is skipped (catalogue/verify.md)
  const add = (id: string, slot: string, detail: string) => {
    const meta = checkMeta.get(id) ?? { severity: "fail", fix: "none" };
    if (onRoute(meta)) findings.push({ id, severity: meta.severity, fix: meta.fix, slot, detail });
  };
  const flags: string[] = employment ? [] : (job.frontmatter?.flags ?? []);
  const alertLevel = compute({ route, flags }).alert_level;
  const planSlots: string[] = cat.slots.plan_slots ?? [];

  const body = letter.body.replace(/\s+$/, "");
  if (employment && !body.trim()) {
    const brief = { route, template: cat.templateName, resume_only: true, version: version ? { name: version.name, source: version.source, summary: version.summary } : null };
    return { findings, letter_skipped: true, slots: [], counts: null, brief, fails: 0, warns: 0 };
  }
  const seg = employment ? segmentEmployment(body) : segment(body, { headers: cat.slots.headers, planSlots });
  const own = lineOwner(seg);
  const lines = seg.lines;
  const at = (l: number) => `line ${l}`;

  // slot/parse stops the run; everything else still reports so the human sees it all
  for (const e of seg.errors) add("slot/parse", "letter", e);

  const templateSlots: Any[] = (cat.template.slots ?? []).map((s: Any) => (typeof s === "string" ? { id: s } : s));
  const templateIds = new Set(templateSlots.map((s) => s.id));
  const jobAsks = new Set(templateSlots.filter((s) => s.when === "job asks").map((s) => s.id));
  const present = new Set(seg.slots.map((s) => s.id));
  const planPresent = seg.slots.filter((s) => planSlots.includes(s.id)).map((s) => s.id);
  const planSlot = planPresent[0] ?? planSlots[0] ?? null;

  // slot
  if (!employment && planPresent.length !== 1) add("slot/plan-count", "letter", planPresent.length ? `${planPresent.length} plan Slots (${planPresent.join(", ")}); a Letter carries exactly one of ${planSlots.join(", ")}` : `no plan Slot; a Letter carries exactly one of ${planSlots.join(", ")} (or its header line is missing)`);
  for (const s of seg.slots) {
    if (s.headerMissing) add("slot/header-missing", s.id, `list at ${at(s.paragraphs[0].start)} opens without "${cat.slots.headers[s.id]}"`);
    if (s.header && s.header.endsWith(":") && /\byou(?:r|'ve|'re|rs)?\b/i.test(s.header)) add("slot/header-second-person", s.id, `header "${s.header}" addresses the reader; reword in first person`);
    if (!templateIds.has(s.id)) add("slot/extra", s.id, `${s.id} at ${at(s.paragraphs[0].start)} is not in the ${cat.templateName} template`);
  }

  // voice
  const banned: string[] = [...(cat.voiceRules.banned ?? []), ...(voice.banned_extra ?? [])].filter((p: string) => !(voice.allowed_extra ?? []).some((a: string) => a.toLowerCase() === p.toLowerCase()));
  const selfDeprecation: string[] = cat.voiceRules.self_deprecation ?? [];
  const runs = postingRuns(job.body);
  const headerLines = new Set(seg.slots.map((s) => s.headerLine).filter((n): n is number => n !== null));
  lines.forEach((line, i) => {
    const n = i + 1, slot = own(n);
    for (const p of banned) if (phraseRe(p).test(line)) add("voice/banned-phrase", slot, `"${p}" at ${at(n)}`);
    for (const p of selfDeprecation) if (phraseRe(p).test(line)) add("voice/self-deprecation", slot, `"${p}" at ${at(n)}`);
    for (const w of cat.voiceRules.soft_banned ?? []) if (phraseRe(w).test(line)) add("voice/soft-banned", slot, `"${w}" at ${at(n)}`);
    if (line.includes("!")) add("voice/exclamation", slot, at(n));
    if ((line.match(/;/g) ?? []).length >= 2) add("voice/semicolon-chain", slot, `${(line.match(/;/g) ?? []).length} semicolons at ${at(n)}`);
    const unquoted = stripQuotes(line);
    for (const hit of unquoted.matchAll(WE)) if (hit[1] !== "US") add("voice/first-person-plural", slot, `"${hit[1]}" at ${at(n)}`);
    const self = SELF_WORDS.exec(unquoted);
    if (self) add("voice/self-descriptive", slot, `"${self[0]}" at ${at(n)}`);
    if (!headerLines.has(n)) { const run = copiedRun(line, runs); if (run) add("voice/posting-copy", slot, `"${run}" at ${at(n)} is copied from the posting`); }
  });

  // format
  const acronyms = new Set(COMMON_ACRONYMS);
  const harvest = (text: unknown) => { for (const t of String(text ?? "").matchAll(ACRONYM)) acronyms.add(t[0]); };
  for (const s of skillNames) harvest(s);
  harvest(job.body);
  // the Bullets, Stories and Notes are the Letter's fact source: their acronyms are the Profile's own
  for (const pj of projects) {
    for (const b of pj.bullets) harvest(b.text);
    for (const s of pj.stories) harvest(s.text);
    for (const n of pj.notes) harvest(n);
    harvest((pj.meta.keywords ?? []).join(" ")); harvest(pj.meta.name); harvest(pj.meta.description);
  }
  const urls: { url: string; line: number; slot: string }[] = [];
  lines.forEach((line, i) => {
    const n = i + 1, slot = own(n);
    const noUrl = line.replace(URL_RE, " ");
    if (/\*\*/.test(noUrl) || /(^|\s)\*\S/.test(noUrl) || /(^|\s)_\S[^_]*\S_(\s|$)/.test(noUrl) || /^#/.test(line) || /\[[^\]]+\]\([^)]+\)/.test(line) || /^>/.test(line) || /`/.test(line)) add("format/markdown", slot, at(n));
    if (EMOJI.test(line)) add("format/emoji", slot, at(n));
    for (const t of noUrl.matchAll(ACRONYM)) if (!acronyms.has(t[0])) add("format/all-caps", slot, `"${t[0]}" at ${at(n)}`);
    if (/^[ \t]/.test(line)) add("format/indentation", slot, at(n));
    if (EMAIL.test(noUrl)) add("format/contact", slot, `email at ${at(n)}`);
    if (HANDLE.test(noUrl)) add("format/contact", slot, `handle at ${at(n)}`);
    const phone = PHONE.exec(noUrl);
    if (phone && phone[0].replace(/\D/g, "").length >= 9) add("format/contact", slot, `phone number at ${at(n)}`);
    if (CONTACT_DOMAINS.test(line)) add("format/contact", slot, `messenger, social, or booking link at ${at(n)}`);
    for (const u of line.match(URL_RE) ?? []) urls.push({ url: u, line: n, slot });
    if (/\bwww\.[^\s]+/.test(noUrl)) add("format/url-count", slot, `bare www address at ${at(n)}; only https:// URLs`);
  });
  for (const u of urls) if (!u.url.startsWith("https://")) add("format/url-count", u.slot, `${u.url} at ${at(u.line)} is not https://`);
  const charCap = required(letterCap.chars, `${cat.templateName} cap.chars`);
  if (body.length > charCap) add("format/char-ceiling", "letter", `${body.length} characters, ${cat.templateName} cap ${charCap}`);

  // length: the Letter caps come from the route's template; a cap the template lacks is not checked
  const hasHook = templateIds.has("hook");
  const hook = seg.slots.find((s) => s.id === "hook");
  const hookChars = hook ? hook.text.length : 0;
  const hookMax = hasHook ? required(slotCap(cat.slots, "hook").chars, "letter-slots hook.cap.chars") : null;
  if (hasHook && hookMax !== null && hookChars > hookMax) add("length/hook", "hook", `${hookChars} characters, cap ${hookMax}`);
  const wordCap: number | null = letterCap.prose_words === undefined ? null : required(letterCap.prose_words, `${cat.templateName} cap.prose_words`);
  const ceiling = letterCap.total_words === undefined ? null : required(letterCap.total_words, `${cat.templateName} cap.total_words`);
  let prose = 0, total = 0;
  const perSlot: Record<string, number> = {};
  lines.forEach((line, i) => {
    const n = i + 1, slot = own(n);
    const w = words(line);
    total += w;
    perSlot[slot] = (perSlot[slot] ?? 0) + w;
    if (!headerLines.has(n) && !LIST_LINE.test(line) && slot !== "answers") prose += w;
  });
  if (wordCap !== null && prose > wordCap) add("length/prose-cap", "letter", `${prose} prose words, cap ${wordCap}`);
  if (ceiling !== null && total > ceiling) add("length/total-ceiling", "letter", `${total} words, ceiling ${ceiling}`);
  const listRuns: { start: number; count: number; slot: string }[] = [];
  let run: { start: number; count: number; slot: string } | null = null;
  lines.forEach((line, i) => {
    if (LIST_LINE.test(line)) { if (!run) { run = { start: i + 1, count: 0, slot: own(i + 1) }; listRuns.push(run); } run.count++; } else run = null;
  });
  if (listRuns.length > 1) add("length/list-lines", listRuns[1].slot, `a second list starts at ${at(listRuns[1].start)}; one list per Letter`);
  for (const r of listRuns) {
    if (r.slot !== "deliverables" && r.slot !== "milestones") continue;
    const cap = required(slotCap(cat.slots, r.slot).lines, `letter-slots ${r.slot}.cap.lines`);
    if (r.count > cap) add("length/list-lines", r.slot, `${r.count} list lines, cap ${cap}`);
  }
  const rw = seg.slots.find((s) => s.id === "relevant_work");
  const rwCap = required(slotCap(cat.slots, "relevant_work").paragraphs, "letter-slots relevant_work.cap.paragraphs");
  if (rw && rw.paragraphs.length > rwCap) add("length/relevant-work-count", "relevant_work", `${rw.paragraphs.length} paragraphs, cap ${rwCap}`);

  // terms and closing patterns the voice rules forbid (hour ranges, bounded windows, calls)
  const terms = seg.slots.find((s) => s.id === "terms");
  if (terms) {
    if (/\b\d{1,2}:\d{2}\b|\b\d{1,2}\s?(?:am|pm)\b/i.test(terms.text)) add("terms/hour-range", "terms", "a clock time; state overlap as the client's part of the day");
    if (/\b(?:through|for|over) the next\b|\buntil\b|\bthrough (?:january|february|march|april|may|june|july|august|september|october|november|december|\d)/i.test(terms.text)) add("terms/bounded-window", "terms", "a bounded availability window; say available now or from a date");
  }
  const closing = seg.slots.find((s) => s.id === "closing");
  if (closing && /\b(?:call|walk ?through|walk you through|screen ?share|zoom|google meet|video|demo)\b/i.test(closing.text)) add("closing/call", "closing", "offers a call or a walkthrough; questions are answered in writing");

  // brief for the model pass: Safeguards from the stored Flags (freelance), `plan` resolved to the plan Slot present
  const flagById = new Map(flagsFor(route).map((f) => [f.id, f]));
  const safeguards = flags.map((id) => flagById.get(id)).filter((f) => f && (!f.kind || f.kind === "risk") && f.slot && f.slot !== "none")
    .map((f) => ({ id: f!.id, level: f!.level, slot: f!.slot === "plan" ? planSlot : f!.slot!, safeguard: f!.safeguard }))
    .filter((f) => f.slot && templateIds.has(f.slot));
  const counts = { chars: body.length, char_cap: charCap, words: total, prose_words: prose, word_cap: wordCap, total_ceiling: ceiling, hook_chars: hookChars, hook_max: hookMax, urls: urls.length, lists: listRuns.length, per_slot: perSlot };
  const brief = {
    route, template: cat.templateName, plan_slot: employment ? null : planSlot, alert_level: alertLevel, flags, safeguards,
    job_asks_present: seg.slots.filter((s) => jobAsks.has(s.id)).map((s) => s.id),
    template_slots: templateSlots, terms: profileMeta.terms ?? {}, projects: projects.map(projectFacts),
    answers,
    version: version ? { name: version.name, source: version.source, summary: version.summary } : null,
    mandatory_keyword: flags.includes("mandatory-keyword"),
    skills: skillNames,
  };
  const slots = seg.slots.map((s) => ({ id: s.id, header: s.header, demand: s.demand, header_line: s.headerLine, paragraphs: s.paragraphs.map((p) => [p.start, p.end]), words: words(s.text), chars: s.text.length }));
  const order = { fail: 0, warn: 1 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { findings, letter_skipped: false, slots, counts, brief, fails: findings.filter((f) => f.severity === "fail").length, warns: findings.filter((f) => f.severity === "warn").length };
}

export function render(r: Analysis): string {
  const out: string[] = [];
  if (r.letter_skipped) {
    out.push("letter pass: skipped, letter.md is empty (a resume-only application)");
    if (r.brief.version) out.push(`version: ${r.brief.version.name} (${r.brief.version.source})`);
    return out.join("\n");
  }
  out.push(`script: ${r.fails} fail, ${r.warns} warn (line numbers count from the start of letter.md)`);
  for (const f of r.findings) out.push(`  ${f.severity} ${f.id} [${f.slot}] ${f.detail} -> ${f.fix}`);
  out.push("", "slots:");
  for (const s of r.slots) {
    const range = s.paragraphs.map(([a, b]: number[]) => (a === b ? `${a}` : `${a}-${b}`)).join(", ");
    out.push(`  ${s.id}${s.demand ? ` (${s.demand})` : ""}: lines ${range}${s.header_line ? `, header line ${s.header_line}` : ""}, ${s.words} words${s.id === "hook" ? `, ${s.chars} chars` : ""}`);
  }
  const c = r.counts!;
  const parts = [`${c.chars} chars (cap ${c.char_cap})`, `${c.words} words${c.total_ceiling === null ? "" : ` (ceiling ${c.total_ceiling})`}`];
  if (c.word_cap !== null) parts.push(`${c.prose_words} prose words (cap ${c.word_cap})`);
  if (c.hook_max !== null) parts.push(`hook ${c.hook_chars}/${c.hook_max} chars`);
  parts.push(`${c.urls} URLs`, `${c.lists} list${c.lists === 1 ? "" : "s"}`);
  out.push("", `counts: ${parts.join(", ")}`);
  const b = r.brief;
  out.push("", `brief: route ${b.route}, template ${b.template}${b.plan_slot ? `, plan Slot ${b.plan_slot}` : ""}, Alert Level ${b.alert_level}, Flags: ${b.flags.join(", ") || "none"}`);
  if (b.version) out.push(`  Version sent: ${b.version.name} (${b.version.source}); summary: ${b.version.summary ?? "does not read"}`);
  out.push(`  safeguards to find (${b.safeguards.length}):`);
  for (const mit of b.safeguards) out.push(`    ${mit.id} (level ${mit.level}) in ${mit.slot}: ${mit.safeguard}`);
  out.push(`  when-job-asks Slots present: ${b.job_asks_present.join(", ") || "none"}`);
  out.push(`  mandatory-keyword Flag: ${b.mandatory_keyword ? "triggered, the keyword must appear nowhere in the Letter" : "no"}`);
  out.push(`  Profile terms: ${JSON.stringify(b.terms)}`);
  out.push(`  Answers (a Letter source, cited as "Answer <slug>"; a question block matching none is printed after verify as a draft Answer):`);
  for (const a of b.answers) out.push(`    ${a.slug}: ${a.question}`);
  if (!b.answers.length) out.push("    none");
  out.push(`  Projects (facts the Letter may cite: Bullets by key, then Notes):`);
  for (const p of b.projects) {
    out.push(`    ${p.slug}: ${p.name}${p.url ? ` (${p.url})` : ""}, ${p.role}, ${p.employment}, ${p.period}, naming ${p.naming}, ${p.bullets.length} Bullets, ${p.notes.length} Notes`);
    for (const bl of p.bullets) out.push(`      - [${bl.key}] ${bl.text}${bl.story ? ` (${bl.story})` : ""}`);
    for (const n of p.notes) out.push(`      - ${n}`);
  }
  out.push(`  Profile Skills: ${b.skills.join(", ")}`);
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const candidate = args.find((a) => !a.startsWith("--"));
  if (!candidate) { console.error("usage: verify.ts <candidate> [--json]"); process.exit(2); }
  let inputs: Inputs;
  try { inputs = loadInputs(candidate); } catch (e) { console.error(`autotriage: verify script: ${(e as Error).message}`); process.exit(2); }
  const r = analyse(inputs);
  console.log(json ? JSON.stringify(r, null, 2) : render(r));
  process.exit(r.fails ? 1 : 0);
}
