// Renders a version to PDF: Markdown to HTML with cv.css, printed by headless Chrome, then checked.
// The input path is the first argument, relative to the repo root. The default, versions/general.md, writes
// Konstantin_Dolbilov_Resume.pdf at the root; any other input writes a PDF of the same base name next to itself.
// An entry `### <slug>` takes its heading from the Project file data/projects/<slug>.md; the version's Skills
// section is checked against the ledger data/profile/skills.md for the version's `role`.
// The target PDF is replaced only when every check passes. Work files go to pdf-renderer/out/.
// Run: npm --prefix pdf-renderer run build -- [input]   (override the browser with CHROME=/path/to/chrome)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { marked } from 'marked'
import YAML from 'yaml'

const root = new URL('..', import.meta.url).pathname
const here = new URL('.', import.meta.url).pathname
const out = here + 'out/'
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const GENERAL = 'versions/general.md'
const PDF_NAME = 'Konstantin_Dolbilov_Resume.pdf'
const PROJECTS = 'data/projects/'
const LEDGER = 'data/profile/skills.md'
const MAX_BYTES = 2.5 * 1024 * 1024 // Greenhouse upload limit
const A4 = [595.28, 841.89] // pt

// Paragraphs after the h1, by position.
const HEADER = ['headline', 'contact', 'summary']
const ROLE = /^(.+?) \| (.+)$/
// An `###` whose text is a bare slug names the Project file data/projects/<slug>.md.
const SLUG = /^[a-z0-9][a-z0-9-]*$/
// The renderer's rules for the entry heading, as docs/format-rules.md states them: the role suffix by
// employment, and the period as `Mon YYYY – Mon YYYY`, `Present` when the Project has no end.
const SUFFIX = { 'full-time': '', 'part-time': '', contract: ' (Contract)', freelance: ' (Freelance)', independent: '' }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const month = ym => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`
const period = ({ start, end }) => `${month(String(start))} – ${end ? month(String(end)) : 'Present'}`
const META = ['name', 'url', 'role', 'employment', 'start', 'description', 'keywords']

// Wraps every hyphenated token in text nodes, never in tags or attributes, in a nowrap span.
const nowrapHyphens = html => html.replace(/<[^>]*>|[^<]+/g, m => m[0] === '<' ? m : m.replace(/\S+-\S+/g, '<span class="nb">$&</span>'))

// Markdown with YAML frontmatter: the Version (its `role`) and a Project file (its meta).
function frontmatter(md) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(md)
  return m ? { meta: YAML.parse(m[1]) ?? {}, body: m[2] } : { meta: null, body: md }
}

// The meta of one Project file, or null with the reasons it cannot be rendered.
function readProject(slug, problems) {
  const file = PROJECTS + slug + '.md'
  if (!existsSync(root + file)) return problems.push(`${file}: no Project file`), null
  const { meta } = frontmatter(readFileSync(root + file, 'utf8'))
  if (!meta) return problems.push(`${file}: no frontmatter, not in the Project shape`), null
  const missing = META.filter(k => meta[k] == null)
  if (missing.length) problems.push(`${file}: missing ${missing.join(', ')}`)
  if (!(meta.employment in SUFFIX)) problems.push(`${file}: employment "${meta.employment}" is none of ${Object.keys(SUFFIX).join(', ')}`)
  return missing.length ? null : { slug, file, ...meta }
}

// Positions in the version carry the parts Markdown has no element for:
// the paragraphs after `#` are headline, contact line and summary; the paragraph right after `###` is the
// project description, set off by an en dash so the text layer separates it from the name; a paragraph whose
// every line is `Title | dates` is a block of role rows. An `###` naming a Project file by its slug takes its
// heading, description and role row from the file's meta instead. Hyphenated tokens in text nodes get a
// nowrap span, so a word such as DCEL-based never breaks at its hyphen and de-hyphenates in the text layer.
function toHtml(md) {
  const html = []
  const roles = []
  const projects = []
  const problems = []
  const { meta, body: source } = frontmatter(md)
  let title = ''
  let header = null
  let project = null
  let skills = null
  const roleRow = (role, dates) => {
    roles.push([role, dates])
    html.push(`<p class="role"><span class="title">${marked.parseInline(role)}</span> <span class="dates">${dates}</span></p>`)
  }
  for (const t of marked.lexer(source)) {
    if (t.type === 'space') continue
    if (project !== null) {
      const desc = t.type === 'paragraph' && !t.text.includes('\n') && !ROLE.test(t.text)
      html.push(`<h3>${project}${desc ? ` <span class="desc">– ${marked.parseInline(t.text)}</span>` : ''}</h3>`)
      project = null
      if (desc) continue
    }
    if (t.type === 'heading') {
      header = t.depth === 1 ? 0 : null
      if (t.depth === 1) title = t.text
      if (t.depth === 2 && t.text === 'Skills') skills = []
      if (t.depth === 3 && SLUG.test(t.text)) {
        const p = readProject(t.text, problems)
        if (!p) continue
        projects.push(p)
        html.push(`<h3>${marked.parseInline(`[${p.name}](${p.url})`)} <span class="desc">– ${marked.parseInline(p.description)}</span></h3>`)
        roleRow(p.role + (SUFFIX[p.employment] ?? ''), period(p))
      } else if (t.depth === 3) project = marked.parseInline(t.text)
      else html.push(`<h${t.depth}>${marked.parseInline(t.text)}</h${t.depth}>`)
      continue
    }
    if (t.type === 'list' && skills !== null && !skills.length) {
      // The Skills lines: `Label: term, term`; the terms are checked against the ledger.
      for (const item of t.items) skills.push(...item.text.replace(/^[^:]+: /, '').split(', '))
    }
    if (t.type === 'paragraph' && header !== null) {
      const cls = HEADER[header++]
      html.push(`<p${cls ? ` class="${cls}"` : ''}>${marked.parseInline(t.text)}</p>`)
      continue
    }
    const lines = t.type === 'paragraph' ? t.text.split('\n') : []
    if (lines.length && lines.every(line => ROLE.test(line))) {
      for (const line of lines) roleRow(...line.match(ROLE).slice(1))
      continue
    }
    html.push(marked.parser([t]))
  }
  if (project !== null) html.push(`<h3>${project}</h3>`)
  if (skills !== null && !meta?.role) problems.push('the version has a Skills section but no `role` in its frontmatter')
  return { title, body: nowrapHyphens(html.join('\n')), roles, projects, problems, role: meta?.role, skills }
}

// The ledger: one row per Skill, `roles` naming the Versions that show it. A Version's term names a row by
// the row's name, one of its `keywords`, the abbreviation in its name's parentheses (RBAC), or the name
// without that parenthetical (Architecture Decision Records, with or without "(ADRs)").
const ledger = () => existsSync(root + LEDGER) ? frontmatter(readFileSync(root + LEDGER, 'utf8')).meta?.skills ?? [] : null
const key = s => s.toLowerCase()
const abbrev = name => /\(([^)]+)\)$/.exec(name)?.[1] ?? ''
const bare = name => name.replace(/\s*\([^)]*\)$/, '')
const named = (term, row) => key(term) === key(row.name) || row.keywords.some(k => key(k) === key(term))
  || key(term) === key(abbrev(row.name)) || key(bare(term)) === key(bare(row.name))

// The Skills section against the ledger: each term one row that carries the Version's role, every row with
// the role present. Returns the problems, or none.
function checkSkills(terms, role, rows) {
  const unknown = terms.filter(t => !rows.some(r => named(t, r)))
  const ambiguous = terms.filter(t => rows.filter(r => named(t, r)).length > 1)
  const otherRole = terms.filter(t => rows.filter(r => named(t, r)).length === 1 && !rows.find(r => named(t, r)).roles.includes(role))
  const missing = rows.filter(r => r.roles.includes(role) && !terms.some(t => named(t, r))).map(r => r.name)
  return [['not in the ledger', unknown], ['more than one row', ambiguous], [`not for role ${role}`, otherRole], ['in the ledger for the role, not in the version', missing]]
    .filter(([, list]) => list.length).map(([what, list]) => `${what}: ${list.join(', ')}`)
}

const page = (title, body, css) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>${css}</style></head>
<body><main>
${body}
</main></body></html>`

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' })

const decode = s => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e])
// Tag-free, entity-decoded text of an HTML fragment.
const text = html => decode(html.replace(/<[^>]+>/g, ''))
// Text compared without whitespace or case: line breaks and text-transform differ by design.
const flat = s => s.replace(/\s/g, '').toLowerCase()
const DATES = /^[A-Z][a-z]{2} \d{4} – ([A-Z][a-z]{2} \d{4}|Present)$/
// The format-rules whitelist: letters, digits, ASCII punctuation, •, – and |.
const FOREIGN = /[^\x20-\x7E\s\p{L}\p{N}•–]/gu

function firstDiff(expected, actual) {
  let i = 0
  while (i < expected.length && expected[i] === actual[i]) i++
  return i === expected.length && i === actual.length ? null
    : `at char ${i}: expected "…${expected.slice(Math.max(0, i - 20), i + 20)}…", got "…${actual.slice(Math.max(0, i - 20), i + 20)}…"`
}

const input = process.argv[2] ?? GENERAL
const target = input === GENERAL ? PDF_NAME : input.replace(/\.[^./]*$/, '') + '.pdf'

mkdirSync(out, { recursive: true })
const { title, body, roles, projects, problems, role, skills } = toHtml(readFileSync(root + input, 'utf8'))
const rows = (skills !== null || projects.length) ? ledger() : []
if (rows === null) problems.push(`${LEDGER}: no ledger`)
if (problems.length) {
  console.log(`FAIL  source: ${problems.join('; ')}`)
  console.log(`${target} left unchanged; nothing rendered`)
  process.exit(1)
}
const htmlPath = out + 'cv.html'
const pdf = out + 'cv.pdf'
writeFileSync(htmlPath, page(title, body, readFileSync(here + 'cv.css', 'utf8')))
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`,
  pathToFileURL(htmlPath).href], { stdio: 'ignore' })

const checks = []
const check = (name, ok, detail) => checks.push({ name, ok, detail })

const info = run('pdfinfo', [pdf])
const pages = +info.match(/Pages:\s+(\d+)/)[1]
check('pages', pages === 1, `${pages}`)
const [w, h] = info.match(/Page size:\s+([\d.]+) x ([\d.]+) pts/).slice(1).map(Number)
check('page size', Math.abs(w - A4[0]) < 2 && Math.abs(h - A4[1]) < 2, `${w} x ${h} pt`)
const pdfTitle = info.match(/Title:\s+(.*)/)?.[1].trim() ?? ''
check('title', pdfTitle === title, `"${pdfTitle}"`)
const bytes = statSync(pdf).size
check('file size', bytes < MAX_BYTES, `${(bytes / 1024).toFixed(0)} KB`)

const images = run('pdfimages', ['-list', pdf]).trim().split('\n').slice(2).length
check('images', images === 0, `${images}`)

// pdffonts rows: name, type (may be two words), encoding, then emb sub uni object gen.
const fonts = run('pdffonts', [pdf]).trim().split('\n').slice(2).map(row => {
  const cols = row.trim().split(/\s+/)
  const [emb, , uni] = cols.slice(-5)
  return { name: cols[0].replace(/^[A-Z]{6}\+/, ''), emb: emb === 'yes', uni: uni === 'yes' }
})
const names = [...new Set(fonts.map(f => f.name))].join(', ')
const stray = fonts.filter(f => !/^(Georgia|HelveticaNeue|Helvetica|Arial)/.test(f.name))
check('fonts embedded', fonts.every(f => f.emb && f.uni), names)
check('fonts intended', fonts.some(f => f.name.startsWith('Georgia')) && fonts.some(f => !f.name.startsWith('Georgia')) && !stray.length,
  stray.length ? `substituted: ${stray.map(f => f.name).join(', ')}` : 'Georgia and the heading sans')

// -raw reads the content stream, which Chrome writes in DOM order. The default mode orders by geometry, as a parser
// does, and groups stacked right-aligned dates into a column of their own; -layout confirms that each role title
// shares a line with its dates.
// The list bullets are ::before content, so the body gets one per item: a glyph the PDF sets apart from its line fails.
const expected = flat(decode(body.replace(/<li>/g, '<li>• ').replace(/<[^>]+>/g, ' ')))
const diff = firstDiff(expected, flat(run('pdftotext', ['-raw', '-enc', 'UTF-8', pdf, '-'])))
check('text layer', diff === null, diff ?? 'every word in reading order, no header or footer')
const plain = run('pdftotext', ['-enc', 'UTF-8', pdf, '-'])
const order = firstDiff(expected, flat(plain))
check('reading order', order === null, order ?? 'the default pdftotext mode reads the same text')
const h1 = text(body.match(/<h1>(.*?)<\/h1>/)[1])
const firstLine = plain.split('\n')[0]
check('first line', firstLine === h1, `"${firstLine}"`)
const bullets = (plain.match(/•/g) ?? []).length
const wanted = (body.match(/<li>/g) ?? []).length + (text(body.match(/<p class="contact">(.*?)<\/p>/)?.[1] ?? '').match(/•/g) ?? []).length
check('bullets', bullets === wanted, `${bullets} of ${wanted}: one per list item plus the contact separators`)
const layout = run('pdftotext', ['-layout', '-enc', 'UTF-8', pdf, '-']).split('\n')
const split = roles.filter(([role, dates]) => !layout.some(line => line.includes(decode(role.replace(/<[^>]+>/g, ''))) && line.includes(dates)))
check('role lines', !split.length, split.length ? `split from dates: ${split.map(([role]) => role).join(', ')}` : 'each title on one line with its dates')
const broken = layout.filter(line => /-\s*$/.test(line))
check('hyphens', !broken.length, broken.length ? `line ends with a hyphen: "${broken[0].trim()}"` : 'no word broken at its hyphen')
const odd = roles.filter(([, dates]) => !DATES.test(dates))
check('dates', !odd.length, odd.length ? `off format: ${odd.map(([, dates]) => dates).join(', ')}` : 'Mon YYYY – Mon YYYY or Present throughout')
const foreign = [...new Set(text(body).match(FOREIGN) ?? [])]
check('characters', !foreign.length, foreign.length
  ? `outside the whitelist: ${foreign.map(c => `${c} U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(', ')}`
  : 'letters, digits, punctuation, •, – and |')
if (skills !== null) {
  const wrong = checkSkills(skills, role, rows)
  check('skills', !wrong.length, wrong.length ? wrong.join('; ') : `${skills.length} terms, the ledger's rows for role ${role}, none missing`)
}
if (projects.length) {
  const stray = projects.flatMap(p => p.keywords.filter(k => !rows.some(r => r.name === k)).map(k => `${p.slug}: ${k}`))
  check('keywords', !stray.length, stray.length ? `not a ledger Skill: ${stray.join(', ')}` : `${projects.map(p => p.slug).join(', ')}: every keyword a ledger Skill`)
}

run('pdftoppm', ['-png', '-r', '110', '-f', '1', '-l', '1', '-singlefile', pdf, out + 'cv'])

for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}: ${c.detail}`)
console.log(`Screenshot: pdf-renderer/out/cv.png`)
if (checks.every(c => c.ok)) {
  copyFileSync(pdf, root + target)
  console.log(`Wrote ${target}`)
} else {
  console.log(`${target} left unchanged; failed render at pdf-renderer/out/cv.pdf`)
  process.exitCode = 1
}
