// Script half of the verify State (catalogue/verify.md). On the employment route runs the Version pass
// first (the Version's summary and ledger rows against job.md requirements and title). Segments the plain-text Letter into Slots
// by the route's template (a Family template on the freelance route, letter-employment on the
// employment route) and runs every Check marked `by: script`; the model Checks, the Fixes, and the
// cycles are the skill's job. Prints Findings, the Slot map with line numbers, the counts, and the brief the model
// pass reads (Safeguards to look for, `when: job asks` Slots present, Profile terms, shipped Skills).
// An empty cover-letter.md body is a CV-only application: the Version pass runs alone.
// CLI: node scripts/verify.mjs <candidate> [--json]
//   exit 0 when no script Check fails, 1 when one does, 2 on usage or a missing input.
import fs from "node:fs";
import path from "node:path";
import { readArtifact, readLedger, loadCatalogue, flagsFor, candidateDir, readProjects, letterFileFor, templateFor, PLUGIN_ROOT, PROFILE_DIR, VERSIONS_DIR } from "./lib.mjs";
import { match } from "./skills.mjs";
import { introSummary } from "./version.mjs";

const LIST_LINE = /^(?:-|\d+[.)])\s/;
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
// A lone block between relevant_work and closing in a cover letter is terms when it reads as terms.
const TERMS_CUE = /\b(?:available|availability|notice|start|timezone|time zone|overlap|relocat\w*|remote|hybrid|on-site|salary|based in)\b/i;

export function loadInputs(candidate) {
  const dir = candidateDir(candidate);
  if (!dir || !fs.existsSync(dir)) throw new Error(`no Candidate folder for "${candidate}"`);
  const job = readArtifact(path.join(dir, "job.md"));
  if (!job) throw new Error(`data/candidates/${candidate} lacks job.md`);
  const letterFile = letterFileFor(job.frontmatter?.route);
  const letter = readArtifact(path.join(dir, letterFile));
  if (!letter) throw new Error(`data/candidates/${candidate} lacks ${letterFile}`);
  const profile = readArtifact(path.join(PROFILE_DIR, "profile.md"))?.frontmatter ?? {};
  const voice = readArtifact(path.join(PROFILE_DIR, "voice.md"))?.frontmatter ?? {};
  const projects = readProjects().filter((p) => !p.errors.length);
  const skills = readLedger()?.frontmatter?.skills ?? [];
  const version = job.frontmatter?.route === "employment" ? readVersion(dir, letter.frontmatter?.version, profile) : null;
  return { candidate, letter, job, profile, skills, voice, projects, version };
}

// The Version the Candidate is sent with (cover-letter.md `version`): its role and summary, and on
// `tailored` the whole version.md text, which the Version pass reads instead of the summary and the ledger.
export function readVersion(dir, name, profile) {
  const { source, text: summary } = introSummary(profile, dir, name);
  if (name === "tailored") {
    const art = readArtifact(path.join(dir, "version.md"));
    return { name, role: art?.frontmatter?.role ?? null, summary, source, text: art?.body ?? null };
  }
  const role = readArtifact(path.join(VERSIONS_DIR, `${name}.md`))?.frontmatter?.role ?? null;
  return { name, role, summary, source, text: null };
}

function loadCatalogues(route, family) {
  const verify = loadCatalogue("verify");
  const voiceRules = loadCatalogue("voice");
  const slots = readArtifact(path.join(PLUGIN_ROOT, "catalogue", "templates", "letter-slots.md")).frontmatter;
  const templateName = templateFor(route, family);
  const templateFile = path.join(PLUGIN_ROOT, "catalogue", "templates", `${templateName}.md`);
  const template = fs.existsSync(templateFile) ? readArtifact(templateFile).frontmatter : null;
  return { verify, voiceRules, slots, template, templateName };
}

// A catalogue number the script needs; a missing one is a catalogue bug, never a silent default.
function required(value, key) {
  if (typeof value !== "number") throw new Error(`catalogue value ${key} is missing or not a number`);
  return value;
}
function slotCap(slots, id) {
  const cap = slots.slots.find((s) => s.id === id)?.cap;
  if (!cap) throw new Error(`catalogue value letter-slots ${id}.cap is missing`);
  return cap;
}

function words(text) {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function isHeader(line) {
  if (/https?:\/\//.test(line)) return false;
  return (/:\s*$/.test(line) && words(line) <= 12) || /\?\s*$/.test(line);
}

// Blocks are runs of non-blank lines; line numbers are 1-based within the Letter body.
function toBlocks(body) {
  const lines = body.replace(/\r/g, "").split("\n");
  const blocks = [];
  let cur = null;
  lines.forEach((raw, i) => {
    if (raw.trim() === "") { cur = null; return; }
    if (!cur) { cur = { start: i + 1, end: i + 1, lines: [] }; blocks.push(cur); }
    cur.end = i + 1;
    cur.lines.push(raw);
  });
  return { lines, blocks };
}

// Deterministic segmentation per "Finding Slots in plain text" in catalogue/verify.md.
export function segment(body, { headers, planSlot }) {
  const { lines, blocks } = toBlocks(body);
  const errors = [];
  const slots = [];
  const headerMap = new Map(Object.entries(headers).filter(([, h]) => h).map(([id, h]) => [h.trim().toLowerCase(), id]));
  const push = (slot) => { slots.push(slot); return slot; };
  const mk = (id, block, { header = null, contentLines = block.lines, start = block.start } = {}) =>
    ({ id, header, demand: null, paragraphs: [{ start, end: block.end, lines: contentLines }], headerLine: header ? block.start : null });

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
  let current = null;
  for (const b of middle) {
    const first = b.lines[0];
    if (isHeader(first)) {
      const key = first.trim().toLowerCase();
      let id = headerMap.get(key) ?? "answers";
      // an ask header over a list is the plan Slot answering that ask (Slot catalogue, Ask headers)
      if (id === "answers" && b.lines.length > 1 && LIST_LINE.test(b.lines[1]) && !slots.some((s) => s.id === planSlot)) id = planSlot;
      if (id !== "answers" && slots.some((s) => s.id === id)) errors.push(`Slot ${id} appears twice (second header on line ${b.start})`);
      if (b.lines.length === 1) errors.push(`header "${first.trim()}" on line ${b.start} has no content under it`);
      const slot = push(mk(id, b, { header: first.trim(), contentLines: b.lines.slice(1), start: b.start + 1 }));
      if (!headerMap.has(key)) slot.demand = first.trim().replace(/[:?]\s*$/, "");
      current = slot;
    } else if (LIST_LINE.test(first)) {
      // a list without its header: the plan Slot lost its header line
      const slot = push(mk(planSlot, b));
      slot.headerMissing = true;
      current = slot;
    } else if (!current) {
      errors.push(`block at lines ${b.start}-${b.end} has no header and follows the hook directly`);
    } else if (current.id === "deliverables" || current.id === "milestones" || current.id === "working_model") {
      // prose after the plan block: follow_on (audit); slot/extra reports it for other Families
      current = push(mk("follow_on", b));
    } else {
      current.paragraphs.push({ start: b.start, end: b.end, lines: b.lines });
    }
  }
  // trailing prose lines inside a list block are follow_on too (no blank line before them)
  for (const slot of [...slots]) {
    if (slot.id !== "deliverables" && slot.id !== "milestones") continue;
    const p = slot.paragraphs[0];
    let lastList = -1;
    p.lines.forEach((l, i) => { if (LIST_LINE.test(l)) lastList = i; });
    if (lastList >= 0 && lastList < p.lines.length - 1) {
      const tailLines = p.lines.slice(lastList + 1);
      const start = p.start + lastList + 1;
      p.lines = p.lines.slice(0, lastList + 1);
      p.end = start - 1;
      const at = slots.indexOf(slot);
      slots.splice(at + 1, 0, { id: "follow_on", header: null, demand: null, headerLine: null, paragraphs: [{ start, end: p.end + tailLines.length, lines: tailLines }] });
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
  for (const s of slots) s.text = s.paragraphs.map((p) => p.lines.join("\n")).join("\n\n");
  return { lines, blocks, slots, greeting, errors };
}

// The cover letter has no headers, so its Slots are found by position (catalogue/verify.md): greeting,
// intro, relevant_work, then gaps and terms when present, closing, sign_off.
export function segmentEmployment(body) {
  const { lines, blocks } = toBlocks(body);
  const errors = [];
  const slots = [];
  const mk = (id, b) => ({ id, header: null, demand: null, headerLine: null, paragraphs: [{ start: b.start, end: b.end, lines: b.lines }] });
  if (blocks.length < 5) {
    errors.push(`too few blocks (${blocks.length}); a cover letter has at least greeting, intro, relevant work, closing, sign-off`);
    return { lines, blocks, slots, greeting: blocks[0] ?? null, errors };
  }
  if (blocks.length > 7) errors.push(`too many blocks (${blocks.length}); a cover letter has at most greeting, intro, relevant work, gaps, terms, closing, sign-off`);
  const greeting = blocks[0];
  if (greeting.lines.length > 1) errors.push(`block 1 (lines ${greeting.start}-${greeting.end}) is the greeting and must be one line`);
  for (const b of blocks) if (isHeader(b.lines[0]) && b !== greeting) errors.push(`line ${b.start} opens with a header; a cover letter has none`);
  const middle = blocks.slice(2, -2);
  const ids = middle.length === 3 ? ["relevant_work", "gaps", "terms"]
    : middle.length === 2 ? ["relevant_work", TERMS_CUE.test(middle[1].lines.join(" ")) ? "terms" : "gaps"]
    : ["relevant_work"];
  slots.push(mk("intro", blocks[1]));
  middle.slice(0, 3).forEach((b, i) => slots.push(mk(ids[i], b)));
  slots.push(mk("closing", blocks.at(-2)), mk("sign_off", blocks.at(-1)));
  if (blocks.at(-1).lines.length > 1) errors.push(`sign-off (lines ${blocks.at(-1).start}-${blocks.at(-1).end}) must be one line`);
  for (const s of slots) s.text = s.paragraphs.map((p) => p.lines.join("\n")).join("\n\n");
  return { lines, blocks, slots, greeting, errors };
}

function lineOwner(seg) {
  const owner = new Map();
  if (seg.greeting) for (let l = seg.greeting.start; l <= seg.greeting.end; l++) owner.set(l, "greeting");
  for (const s of seg.slots) {
    if (s.headerLine) owner.set(s.headerLine, s.id);
    for (const p of s.paragraphs) for (let l = p.start; l <= p.end; l++) owner.set(l, s.id);
  }
  return (l) => owner.get(l) ?? "?";
}

// The posting's role noun: the title without seniority words, a parenthesis, or what follows a dash, a bar or a comma.
const SENIORITY = /^(?:senior|sr\.?|junior|jr\.?|lead|staff|principal|mid(?:-level)?|middle)\s+/i;
export function roleNoun(title) {
  let t = String(title ?? "").replace(/\([^)]*\)/g, " ").split(/\s[-–—|]\s|,/)[0].replace(/\s+/g, " ").trim();
  while (SENIORITY.test(t)) t = t.replace(SENIORITY, "");
  return t || null;
}
function normRole(s) {
  return String(s).toLowerCase().replace(/\b(front|back)[- ]end\b/g, "$1end").replace(/\bfull[- ]stack\b/g, "fullstack").replace(/\s+/g, " ");
}

// Version pass (catalogue/verify.md, version): every requirement the Version does not carry, and the
// role noun its summary lacks. Both warn; the Version is the human's document.
export function versionPass(job, version, skills) {
  const findings = [];
  const add = (id, detail) => findings.push({ id, severity: "warn", fix: "none", slot: "version", detail, pass: "version" });
  const requirements = job.frontmatter?.requirements ?? [];
  const tailored = version?.name === "tailored";
  const text = (tailored ? version.text : version?.summary) ?? "";
  const where = tailored ? "is not in version.md" : `is in neither the ${version?.name} summary nor the ${version?.role} ledger rows`;
  const inText = (term) => text && phraseRe(term).test(text);
  for (const req of requirements) {
    const rows = match({ skills }, req);
    const covered = inText(req) || rows.some((r) => (!tailored && (r.roles ?? []).includes(version?.role)) || [r.name, ...(r.keywords ?? [])].some(inText));
    if (!covered) add("version/keyword-coverage", `"${req}" ${where}`);
  }
  const noun = roleNoun(job.frontmatter?.title);
  if (!version?.summary) add("version/title-in-summary", `no summary to check: ${version?.source ?? "no version in cover-letter.md"} is missing`);
  else if (noun && !normRole(version.summary).includes(normRole(noun))) add("version/title-in-summary", `"${noun}" from the title "${job.frontmatter.title}" is absent from the summary (${version.source})`);
  return { name: version?.name ?? null, role: version?.role ?? null, source: version?.source ?? null, requirements: requirements.length, role_noun: noun, findings };
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function phraseRe(p) {
  const a = /^\w/.test(p) ? "\\b" : "", z = /\w$/.test(p) ? "\\b" : "";
  return new RegExp(`${a}${escapeRe(p)}${z}`, "i");
}
function stripQuotes(line) { return line.replace(/"[^"]*"|“[^”]*”/g, " "); }

// The Project facts a Letter may cite, harvested from the frontmatter and the Stories (GEM-337): the
// model's fact table traces every Letter fact to one of these lines.
export function projectFacts(p) {
  const fm = p.frontmatter ?? {};
  const stories = (p.themes ?? []).flatMap((t) => t.stories);
  return {
    slug: p.slug, name: fm.name, url: fm.url ?? null, role: fm.role, employment: fm.employment,
    period: `${fm.start} – ${fm.end ?? "present"}`, naming: fm.naming, description: fm.description ?? null,
    keywords: fm.keywords ?? [], stories: stories.map((s) => ({ theme: s.theme, bullet: s.lead, context: s.context })),
  };
}

export function analyse({ candidate, letter, job, profile, skills = [], voice, projects, version = null }) {
  const route = job.frontmatter?.route ?? "freelance";
  const employment = route === "employment";
  const family = employment ? null : letter.frontmatter?.family;
  const cat = loadCatalogues(route, family);
  const letterCap = cat.template?.cap ?? {};
  const checkMeta = new Map(cat.verify.checks.map((c) => [c.id, c]));
  const onRoute = (meta) => !meta.routes || meta.routes.includes(route);
  const vp = employment ? versionPass(job, version, skills) : null;
  const findings = (vp?.findings ?? []).filter((f) => onRoute(checkMeta.get(f.id) ?? {}));
  // a Check whose routes lack this route is skipped (catalogue/verify.md)
  const add = (id, slot, detail) => {
    const meta = checkMeta.get(id) ?? { severity: "fail", fix: "none" };
    if (onRoute(meta)) findings.push({ id, severity: meta.severity, fix: meta.fix, slot, detail, pass: "letter" });
  };

  const body = letter.body.replace(/\s+$/, "");
  if (employment && !body.trim()) {
    const brief = { route, template: cat.templateName, family: null, cv_only: true };
    return { findings, version: vp, letter_skipped: true, slots: [], counts: null, brief, fails: 0, warns: findings.length };
  }
  const planSlot = employment ? null : cat.slots.plan_slot[family];
  const seg = employment ? segmentEmployment(body) : segment(body, { headers: cat.slots.headers, planSlot });
  const own = lineOwner(seg);
  const lines = seg.lines;
  const at = (l) => `line ${l}`;

  // slot/parse and slot/family-mismatch stop the run; everything else still reports so the human sees it all
  for (const e of seg.errors) add("slot/parse", "letter", e);
  if (!cat.template) add("slot/parse", "letter", `no template ${cat.templateName} for route ${route}`);
  const letterFile = letterFileFor(route);
  const v = job.frontmatter?.verdict ?? {};
  if (!employment && v.family && v.family !== family) add("slot/family-mismatch", "letter", `letter.md family ${family}, job.md verdict.family ${v.family}`);
  const m = /^(\d{4}-\d{2}-\d{2})-(.+)$/.exec(candidate ?? "");
  if (m && letter.frontmatter?.slug !== m[2]) add("slot/family-mismatch", "letter", `${letterFile} slug ${letter.frontmatter?.slug}, folder slug ${m[2]}`);
  if (m && letter.frontmatter?.date !== m[1]) add("slot/family-mismatch", "letter", `${letterFile} date ${letter.frontmatter?.date}, folder date ${m[1]}`);

  const templateSlots = (cat.template?.slots ?? []).map((s) => (typeof s === "string" ? { id: s } : s));
  const templateIds = new Set(templateSlots.map((s) => s.id));
  const jobAsks = new Set(templateSlots.filter((s) => s.when === "job asks").map((s) => s.id));
  const present = new Set(seg.slots.map((s) => s.id));

  // slot
  if (planSlot && !present.has(planSlot)) add("slot/missing", planSlot, `the ${family} plan Slot "${cat.slots.headers[planSlot]}" is absent (or its header line is missing)`);
  for (const s of seg.slots) {
    if (s.headerMissing) add("slot/header-missing", s.id, `list at ${at(s.paragraphs[0].start)} opens without "${cat.slots.headers[s.id]}"`);
    if (s.header && s.header.endsWith(":") && /\byou(?:r|'ve|'re|rs)?\b/i.test(s.header)) add("slot/header-second-person", s.id, `header "${s.header}" addresses the reader; reword in first person`);
    if (!templateIds.has(s.id)) add("slot/extra", s.id, `${s.id} at ${at(s.paragraphs[0].start)} is not in the ${cat.templateName} template`);
  }

  // voice
  const banned = [...(cat.voiceRules.banned ?? []), ...(voice.banned_extra ?? [])].filter((p) => !(voice.allowed_extra ?? []).some((a) => a.toLowerCase() === p.toLowerCase()));
  lines.forEach((line, i) => {
    const n = i + 1, slot = own(n);
    for (const p of banned) if (phraseRe(p).test(line)) add("voice/banned-phrase", slot, `"${p}" at ${at(n)}`);
    for (const w of cat.voiceRules.soft_banned ?? []) if (phraseRe(w).test(line)) add("voice/soft-banned", slot, `"${w}" at ${at(n)}`);
    if (line.includes("!")) add("voice/exclamation", slot, at(n));
    if ((line.match(/;/g) ?? []).length >= 2) add("voice/semicolon-chain", slot, `${(line.match(/;/g) ?? []).length} semicolons at ${at(n)}`);
    const unquoted = stripQuotes(line);
    for (const hit of unquoted.matchAll(WE)) if (hit[1] !== "US") add("voice/first-person-plural", slot, `"${hit[1]}" at ${at(n)}`);
    const self = SELF_WORDS.exec(unquoted);
    if (self) add("voice/self-descriptive", slot, `"${self[0]}" at ${at(n)}`);
  });

  // format
  const acronyms = new Set(COMMON_ACRONYMS);
  const harvest = (text) => { for (const t of String(text ?? "").matchAll(ACRONYM)) acronyms.add(t[0]); };
  for (const s of skills) harvest(s.name);
  harvest(job.body);
  // the Stories are the Letter's fact source: their acronyms are the Profile's own
  for (const pj of projects) {
    for (const st of pj.themes?.flatMap((t) => t.stories) ?? []) { harvest(st.lead); harvest(st.context); }
    harvest((pj.frontmatter?.keywords ?? []).join(" ")); harvest(pj.frontmatter?.name); harvest(pj.frontmatter?.description);
  }
  const urls = [];
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
  if (urls.length) add("format/url-list", "letter", `${urls.length} URLs: ${urls.map((u) => u.url).join(" ")}`);
  const charCap = cat.template ? required(letterCap.chars, `${cat.templateName} cap.chars`) : null;
  if (charCap !== null && body.length > charCap) add("format/char-ceiling", "letter", `${body.length} characters, ${cat.templateName} cap ${charCap}`);

  // length: the Letter caps come from the route's template; a cap the template lacks is not checked
  const hasHook = templateIds.has("hook");
  const hook = seg.slots.find((s) => s.id === "hook");
  const hookChars = hook ? hook.text.length : 0;
  const hookMax = hasHook ? required(slotCap(cat.slots, "hook").chars, "letter-slots hook.cap.chars") : null;
  if (hasHook && hookChars > hookMax) add("length/hook", "hook", `${hookChars} characters, cap ${hookMax}`);
  const wordCap = letterCap.prose_words === undefined ? null : profile.word_cap ?? required(letterCap.prose_words, `${cat.templateName} cap.prose_words`);
  const ceiling = letterCap.total_words === undefined ? null : required(letterCap.total_words, `${cat.templateName} cap.total_words`);
  let prose = 0, total = 0;
  const perSlot = {};
  lines.forEach((line, i) => {
    const n = i + 1, slot = own(n);
    const w = words(line);
    total += w;
    perSlot[slot] = (perSlot[slot] ?? 0) + w;
    const s = seg.slots.find((x) => x.id === slot);
    const isHeaderLine = s?.headerLine === n;
    if (!isHeaderLine && !LIST_LINE.test(line) && slot !== "answers") prose += w;
  });
  if (wordCap !== null && prose > wordCap) add("length/prose-cap", "letter", `${prose} prose words, word cap ${wordCap}`);
  if (ceiling !== null && total > ceiling) add("length/total-ceiling", "letter", `${total} words, ceiling ${ceiling}`);
  const listRuns = [];
  let run = null;
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

  // brief for the model pass
  const flagById = new Map(flagsFor(job.frontmatter?.route).map((f) => [f.id, f]));
  const safeguards = (v.flags ?? []).map((id) => flagById.get(id)).filter((f) => f && (!f.kind || f.kind === "risk") && f.slot && f.slot !== "none")
    .map((f) => ({ id: f.id, level: f.level, slot: f.slot === "plan" ? planSlot : f.slot, safeguard: f.safeguard }))
    .filter((f) => templateIds.has(f.slot));
  const counts = { chars: body.length, char_cap: charCap, words: total, prose_words: prose, word_cap: wordCap, total_ceiling: ceiling, hook_chars: hookChars, hook_max: hookMax, urls: urls.length, lists: listRuns.length, per_slot: perSlot };
  const brief = {
    route, template: cat.templateName, family, plan_slot: planSlot, alert_level: v.alert_level ?? null, safeguards,
    job_asks_present: seg.slots.filter((s) => jobAsks.has(s.id)).map((s) => s.id),
    template_slots: templateSlots, terms: profile.terms ?? {}, projects: projects.map(projectFacts),
    mandatory_keyword: (v.flags ?? []).includes("mandatory-keyword"),
    shipped_skills: skills.filter((s) => s.level === "shipped").map((s) => s.name),
  };
  const slots = seg.slots.map((s) => ({ id: s.id, header: s.header, demand: s.demand, header_line: s.headerLine, paragraphs: s.paragraphs.map((p) => [p.start, p.end]), words: words(s.text), chars: s.text.length }));
  const order = { fail: 0, warn: 1 };
  // the Version pass prints first, then the Letter pass, fails before warns within each
  findings.sort((a, b) => (a.pass === b.pass ? 0 : a.pass === "version" ? -1 : 1) || order[a.severity] - order[b.severity]);
  return { findings, version: vp, letter_skipped: false, slots, counts, brief, fails: findings.filter((f) => f.severity === "fail").length, warns: findings.filter((f) => f.severity === "warn").length };
}

export function render(r, frontmatterLines) {
  const off = frontmatterLines ?? 0;
  const out = [];
  if (r.version) {
    const v = r.version, vf = r.findings.filter((f) => f.pass === "version");
    out.push(`version pass: ${vf.length} warn (version ${v.name ?? "?"}, role ${v.role ?? "?"}, summary from ${v.source ?? "?"}; ${v.requirements} requirements in job.md${v.requirements ? "" : ", keyword coverage not checked"}; role noun ${v.role_noun ?? "none"})`);
    for (const f of vf) out.push(`  ${f.severity} ${f.id} ${f.detail} -> ${f.fix}`);
    out.push("");
  }
  if (r.letter_skipped) {
    out.push("letter pass: skipped, the cover-letter.md body is empty (a CV-only application)");
    return out.join("\n");
  }
  const letterFindings = r.findings.filter((f) => f.pass === "letter");
  out.push(`script: ${r.fails} fail, ${letterFindings.length - r.fails} warn (line numbers count from the start of the file; the Letter body starts on line ${off + 1})`);
  for (const f of letterFindings) out.push(`  ${f.severity} ${f.id} [${f.slot}] ${f.detail.replace(/line (\d+)/g, (_, n) => `line ${Number(n) + off}`)} -> ${f.fix}`);
  out.push("", "slots:");
  for (const s of r.slots) {
    const range = s.paragraphs.map(([a, b]) => (a === b ? `${a + off}` : `${a + off}-${b + off}`)).join(", ");
    out.push(`  ${s.id}${s.demand ? ` (${s.demand})` : ""}: lines ${range}${s.header_line ? `, header line ${s.header_line + off}` : ""}, ${s.words} words${s.id === "hook" ? `, ${s.chars} chars` : ""}`);
  }
  const c = r.counts;
  const parts = [`${c.chars} chars (cap ${c.char_cap ?? "?"})`, `${c.words} words${c.total_ceiling === null ? "" : ` (ceiling ${c.total_ceiling})`}`];
  if (c.word_cap !== null) parts.push(`${c.prose_words} prose words (cap ${c.word_cap})`);
  if (c.hook_max !== null) parts.push(`hook ${c.hook_chars}/${c.hook_max} chars`);
  parts.push(`${c.urls} URLs`, `${c.lists} list${c.lists === 1 ? "" : "s"}`);
  out.push("", `counts: ${parts.join(", ")}`);
  const b = r.brief;
  out.push("", `brief: route ${b.route}, template ${b.template}${b.family ? `, family ${b.family}, plan Slot ${b.plan_slot}` : ""}, Alert Level ${b.alert_level ?? "?"}`);
  out.push(`  safeguards to find (${b.safeguards.length}):`);
  for (const mit of b.safeguards) out.push(`    ${mit.id} (level ${mit.level}) in ${mit.slot}: ${mit.safeguard}`);
  out.push(`  when-job-asks Slots present: ${b.job_asks_present.join(", ") || "none"}`);
  out.push(`  mandatory-keyword Flag: ${b.mandatory_keyword ? "triggered, the keyword must appear nowhere in the Letter" : "no"}`);
  out.push(`  Profile terms: ${JSON.stringify(b.terms)}`);
  out.push(`  Projects (facts the Letter may cite):`);
  for (const p of b.projects) {
    out.push(`    ${p.slug}: ${p.name}${p.url ? ` (${p.url})` : ""}, ${p.role}, ${p.employment}, ${p.period}, naming ${p.naming}, ${p.stories.length} Stories`);
    for (const st of p.stories) out.push(`      - ${st.bullet}${st.context ? ` | ${st.context}` : ""}`);
  }
  out.push(`  Profile shipped Skills: ${b.shipped_skills.join(", ")}`);
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const candidate = args.find((a) => !a.startsWith("--"));
  if (!candidate) { console.error("usage: verify.mjs <candidate> [--json]"); process.exit(2); }
  let inputs;
  try { inputs = loadInputs(candidate); } catch (e) { console.error(`autotriage: verify script: ${e.message}`); process.exit(2); }
  const r = analyse(inputs);
  const fmLines = inputs.letter.raw === null ? 0 : inputs.letter.raw.split("\n").length + 2;
  console.log(json ? JSON.stringify({ ...r, frontmatter_lines: fmLines }, null, 2) : render(r, fmLines));
  process.exit(r.fails ? 1 : 0);
}
