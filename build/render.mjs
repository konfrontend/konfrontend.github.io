// Renders a version to PDF: Markdown to HTML with cv.css, printed by headless Chrome, then checked.
// The input path is the first argument, relative to the repo root. The default, versions/general.md, writes
// Konstantin_Dolbilov_Resume.pdf at the root; any other input writes a PDF of the same base name next to itself.
// The target PDF is replaced only when every check passes. Work files go to build/out/.
// Run: npm --prefix build run build -- [input]   (override the browser with CHROME=/path/to/chrome)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { marked } from 'marked'

const root = new URL('..', import.meta.url).pathname
const here = new URL('.', import.meta.url).pathname
const out = here + 'out/'
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const GENERAL = 'versions/general.md'
const PDF_NAME = 'Konstantin_Dolbilov_Resume.pdf'
const MAX_BYTES = 2.5 * 1024 * 1024 // Greenhouse upload limit
const A4 = [595.28, 841.89] // pt

// Paragraphs after the h1, by position.
const HEADER = ['headline', 'contact', 'summary']
const ROLE = /^(.+?) \| (.+)$/

// Wraps every hyphenated token in text nodes, never in tags or attributes, in a nowrap span.
const nowrapHyphens = html => html.replace(/<[^>]*>|[^<]+/g, m => m[0] === '<' ? m : m.replace(/\S+-\S+/g, '<span class="nb">$&</span>'))

// Positions in the version carry the parts Markdown has no element for:
// the paragraphs after `#` are headline, contact line and summary; the paragraph right after `###` is the
// project description, set off by an en dash so the text layer separates it from the name; a paragraph whose
// every line is `Title | dates` is a block of role rows. Hyphenated tokens in text nodes get a nowrap span, so a
// word such as DCEL-based never breaks at its hyphen and de-hyphenates in the text layer.
function toHtml(md) {
  const html = []
  const roles = []
  let title = ''
  let header = null
  let project = null
  for (const t of marked.lexer(md)) {
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
      if (t.depth === 3) project = marked.parseInline(t.text)
      else html.push(`<h${t.depth}>${marked.parseInline(t.text)}</h${t.depth}>`)
      continue
    }
    if (t.type === 'paragraph' && header !== null) {
      const cls = HEADER[header++]
      html.push(`<p${cls ? ` class="${cls}"` : ''}>${marked.parseInline(t.text)}</p>`)
      continue
    }
    const lines = t.type === 'paragraph' ? t.text.split('\n') : []
    if (lines.length && lines.every(line => ROLE.test(line))) {
      for (const line of lines) {
        const [, role, dates] = line.match(ROLE)
        roles.push([role, dates])
        html.push(`<p class="role"><span class="title">${marked.parseInline(role)}</span> <span class="dates">${dates}</span></p>`)
      }
      continue
    }
    html.push(marked.parser([t]))
  }
  if (project !== null) html.push(`<h3>${project}</h3>`)
  return { title, body: nowrapHyphens(html.join('\n')), roles }
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
const { title, body, roles } = toHtml(readFileSync(root + input, 'utf8'))
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

run('pdftoppm', ['-png', '-r', '110', '-f', '1', '-l', '1', '-singlefile', pdf, out + 'cv'])

for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}: ${c.detail}`)
console.log(`Screenshot: build/out/cv.png`)
if (checks.every(c => c.ok)) {
  copyFileSync(pdf, root + target)
  console.log(`Wrote ${target}`)
} else {
  console.log(`${target} left unchanged; failed render at build/out/cv.pdf`)
  process.exitCode = 1
}
