// Checks the mechanical rules of docs/cv-guidelines.md on draft.md and every projects/*/highlights-pool.md.
// Judgement rules stay with the reviewer subagent (docs/cv-review.md) and the user.
// Keyword names and banned words come from the guidelines' Tiers and Word list, so the guidelines stay the single source.
// Bullets per section, the page total and the bullet lengths come from the guidelines' Draft structure and Bullets.
// Run: npm --prefix build run lint [-- --draft <file>]   (the pre-commit hook in .githooks/ and the render run it too)
// --draft lints that file as the draft, for a scratch copy with a candidate entry in place.
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const root = new URL('..', import.meta.url).pathname
const read = path => readFileSync(root + path, 'utf8')
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const ROLE = /^(.+?) \| (.+)$/
const DATES = /^[A-Z][a-z]{2} \d{4} – ([A-Z][a-z]{2} \d{4}|Present)$/
const HIGHLIGHT_WORDS = 100

const ABBREVIATED_TITLE = /\b(Sr|Jr|Snr|FE|BE|Dev|Eng|Mgr)\b\.?/
// A number and a count noun in one sentence, unless the sentence states a rate per period ("55 a month", "70 in five weeks").
const NUMBER = /\b\d[\d,.]*\+?\b/
const COUNT_NOUN = /\b(?:tests?|test cases|test files|test suites|cases|suites|files|commits|PRs|pull requests|ADRs|architecture decision records|documents|docs|migrations|records)\b/i
const RATE = /\b(?:a|per)\s+(?:second|minute|hour|day|week|sprint|month|quarter|year)\b|\b(?:in|over|within)\s+(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:seconds?|minutes?|hours?|days?|weeks?|sprints?|months?|quarters?|years?)\b/i
const EXPLANATION = /: it\b|, so |\bso that\b/i
const PLUS_JOIN = /\w\+\w/
const RANK_MARK = /^\*\*[ABC]\*\* /
const COMMIT_SHARE = /\d+(?:\.\d+)?\s?%\s+of\b[^.]*\b(?:commits|PRs|pull requests|lines)\b/i
const DATE = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{4}\b|\b(?:19|20)\d{2}\b/
const HASH = /\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{7,40}\b/
const COMMAND = /`[^`]*\s[^`]*`|`(?:git|npm|npx|node|gh|yarn|pnpm)\b/
const PATH = /(?:^|\s)(?:~\/|\.{1,2}\/|\/[A-Za-z])\S*|\b[\w-]+\/[\w./-]*\.(?:ts|tsx|js|mjs|cjs|vue|java|kt|md|json|ya?ml|css|scss|sh|html)\b/
const STOPWORDS = new Set('a an the and or of to in on for with by from as at so that it its is into over per'.split(' '))

const failures = []
const fail = (file, line, rule, detail) => failures.push(`${file}:${line}: ${rule}: ${detail}`)

// Rendered text: link text instead of the link, no emphasis or code marks.
const plain = s => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '')
const sentences = s => (s.match(/[.!?](?=\s|$)/g) ?? []).length

// Tiers from the guidelines: tier 1 and 2 examples name the technologies a version check knows,
// tier 3 lists the names bullets and Skills lines never carry.
const guidelines = read('docs/cv-guidelines.md')
const tiered = [...guidelines.matchAll(/^\d\. \*\*(?:Platforms|Capabilities)\*\*.*?: (.+?)\. Test:/gm)]
  .flatMap(m => m[1].split(', '))
const noise = [...guidelines.matchAll(/Too (?:specific|generic):.*?such as (.+?)\.(?: |$)/gm)]
  .flatMap(m => m[1].split(/, (?:and )?/))
const wordList = guidelines.split(/^### Word list$/m)[1]?.split(/^#/m)[0] ?? ''
const banned = [...wordList.matchAll(/^- (.+?): (.+)\.$/gm)]
  .flatMap(([, kind, words]) => words.split(', ').map(w => [kind.toLowerCase(), new RegExp(`(?<![\\w-])${esc(w)}(?![\\w-])`, 'i')]))
// Draft numbers from the guidelines: bullets per section and the page total from Draft structure, bullet length from Bullets.
const section = name => guidelines.split(new RegExp(`^## ${name}$`, 'm'))[1]?.split(/^## /m)[0] ?? ''
const BULLETS_PER_SECTION = Object.fromEntries([...section('Draft structure').matchAll(/(\d+)-(\d+) bullets under `## ([^`]+)`/g)].map(m => [m[3], [+m[1], +m[2]]]))
const BULLETS_ON_PAGE = +section('Draft structure').match(/About (\d+) bullets fit the page/)?.[1]
const BULLET_CHARS = +section('Bullets').match(/Up to (\d+) characters/)?.[1]
const BULLET_CHARS_HARD = +section('Bullets').match(/may run to (\d+)/)?.[1] // a bullet the user accepted over the aim
if (!tiered.length || !noise.length || !banned.length || !Object.keys(BULLETS_PER_SECTION).length || !BULLETS_ON_PAGE || !BULLET_CHARS || !BULLET_CHARS_HARD) {
  console.log('FAIL  lint: cannot read the keyword tiers, the word list or the draft numbers from docs/cv-guidelines.md')
  process.exit(1)
}
const nameRe = name => new RegExp(`(?:^|[^\\w.-])${esc(name)}(?![\\w-])`)
const noiseIn = text => noise.filter(n => {
  const pair = n.match(/^(.+) next to (.+)$/)
  return pair ? nameRe(pair[1]).test(text) && nameRe(pair[2]).test(text) : nameRe(n).test(text)
})

function checkKeywords(file, line, text, names) {
  for (const n of noiseIn(text)) fail(file, line, 'tier 3 keyword', n)
  for (const name of names) {
    const m = text.match(new RegExp(`(?:^|[^\\w.-])(${esc(name)}\\s?v?\\d+(?:\\.\\d+)*)(?![\\w%×])`))
    if (m) fail(file, line, 'version number', m[1])
  }
}

// An acronym and its expansion side by side ("DCEL" next to "doubly connected edge list").
function acronymBesideExpansion(text) {
  const words = text.split(/[\s-]+/).map(w => w.replace(/^[^\w]+|[^\w]+$/g, '')).filter(Boolean)
  for (const acronym of new Set(text.match(/\b[A-Z]{2,6}\b/g) ?? [])) {
    for (let i = 0; i + acronym.length <= words.length; i++) {
      const window = words.slice(i, i + acronym.length)
      if (window.some(w => w === acronym || STOPWORDS.has(w.toLowerCase()))) continue
      if (window.map(w => w[0].toUpperCase()).join('') === acronym) return `${acronym} beside "${window.join(' ')}"`
    }
  }
  return null
}

// Pools

const pools = new Map()
for (const project of readdirSync(root + 'projects')) {
  const file = `projects/${project}/highlights-pool.md`
  if (!existsSync(root + file)) continue
  const lines = read(file).split('\n')
  const pool = { file, title: lines[0], roles: [], description: null, skills: [] }
  pools.set(lines[0].replace(/^# /, ''), pool)

  if (!/^# \[[^\]]+\]\(https?:\/\/[^)\s]+\)$/.test(lines[0])) fail(file, 1, 'title', 'not "# [Brand](https://site)"')
  const firstTheme = lines.findIndex(l => l.startsWith('## '))
  if (firstTheme < 0) fail(file, 1, 'themes', 'no ## theme section')
  const head = lines.slice(1, firstTheme < 0 ? lines.length : firstTheme)
  head.forEach((l, i) => {
    if (!l.trim()) return
    const role = l.match(ROLE)
    if (role) {
      pool.roles.push(l)
      if (!DATES.test(role[2])) fail(file, i + 2, 'role line', `dates not "Mon YYYY – Mon YYYY" or "– Present": ${role[2]}`)
      if (ABBREVIATED_TITLE.test(role[1])) fail(file, i + 2, 'role line', `title not in full: ${role[1]}`)
    } else if (pool.description === null) pool.description = l
    else fail(file, i + 2, 'header', 'more than one description line')
  })
  if (!pool.roles.length) fail(file, 2, 'header', 'no role line')
  if (pool.description === null) fail(file, 2, 'header', 'no description line')

  const last = lines.findLastIndex(l => l.trim())
  if (!lines[last].startsWith('**Skills:** ')) fail(file, last + 1, 'Skills line', 'the pool does not close with "**Skills:** "')
  else pool.skills = lines[last].replace('**Skills:** ', '').split(', ')

  lines.forEach((l, i) => {
    if (i <= firstTheme || !l.startsWith('- ')) return
    if (!RANK_MARK.test(l.slice(2))) fail(file, i + 1, 'rank mark', 'highlight does not open with **A**, **B** or **C**')
    const text = plain(l.slice(2).replace(RANK_MARK, ''))
    const words = text.split(/\s+/).length
    if (words >= HIGHLIGHT_WORDS) fail(file, i + 1, 'highlight length', `${words} words, under ${HIGHLIGHT_WORDS}`)
    if (sentences(text) > 2) fail(file, i + 1, 'highlight length', `${sentences(text)} sentences, two at most`)
    for (const [rule, re] of [['date', DATE], ['commit hash', HASH], ['command', COMMAND], ['file path', PATH]]) {
      const m = l.slice(2).match(re)
      if (m) fail(file, i + 1, rule, m[0].trim())
    }
  })
}

const known = [...new Set([...tiered, ...[...pools.values()].flatMap(p => p.skills)]
  .flatMap(n => [n, n.replace(/\.js$/, '')]))]
  .sort((a, b) => b.length - a.length)

// The keyword names a text carries, longest names claimed first so "React Three Fiber" is not also "React".
function keywordsIn(text, names) {
  const found = []
  for (const name of names) {
    const re = nameRe(name)
    if (re.test(text)) found.push(name), text = text.replace(new RegExp(re.source, 'g'), ' ')
  }
  return found
}
for (const pool of pools.values()) {
  const line = read(pool.file).split('\n').findLastIndex(l => l.trim()) + 1
  if (pool.skills.length) checkKeywords(pool.file, line, pool.skills.join(', '), known)
}

// Draft

const draftArg = process.argv.indexOf('--draft')
const file = draftArg > 0 ? process.argv[draftArg + 1] : 'draft.md'
const lines = readFileSync(draftArg > 0 ? file : root + file, 'utf8').split('\n')
const paragraphs = []
lines.forEach((l, i) => {
  if (!l.trim()) return
  const prev = paragraphs.at(-1)
  if (prev && prev.end === i - 1 && !l.startsWith('#') && !l.startsWith('- ') && !prev.lines[0].startsWith('#'))
    prev.lines.push(l), prev.end = i
  else paragraphs.push({ start: i, end: i, lines: [l] })
})

const contact = paragraphs[2]
for (const [, text, url] of contact?.lines.join(' ').matchAll(/\[([^\]]+)\]\(([^)]+)\)/g) ?? []) {
  const expected = url.replace(/^mailto:/, '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  if (text.replace(/^www\./, '') !== expected) fail(file, contact.start + 1, 'contact line', `link text "${text}" is not its URL "${expected}"`)
}

let total = 0
let draftSection = null
paragraphs.forEach((p, k) => {
  if (p.lines[0].startsWith('## ')) {
    draftSection = p.lines[0].slice(3)
    if (!BULLETS_PER_SECTION[draftSection]) fail(file, p.start + 1, 'section', `no bullet range for "## ${draftSection}" in the guidelines' Draft structure`)
    return
  }
  if (!p.lines[0].startsWith('### ')) return
  const heading = p.lines[0].slice(4)
  const pool = pools.get(heading)
  if (!pool) fail(file, p.start + 1, 'project', `no pool titled "# ${heading}"`)
  const description = paragraphs[k + 1]
  const roles = paragraphs[k + 2]
  if (pool && description?.lines.join(' ') !== pool.description)
    fail(file, (description?.start ?? p.start) + 1, 'description', `differs from ${pool.file}`)
  if (pool && roles?.lines.join('\n') !== pool.roles.join('\n'))
    fail(file, (roles?.start ?? p.start) + 1, 'role rows', `differ from ${pool.file}`)

  const bullets = []
  for (const q of paragraphs.slice(k + 1)) {
    if (q.lines[0].startsWith('#')) break
    if (q.lines[0].startsWith('- ')) bullets.push(q)
  }
  total += bullets.length
  const [min, max] = BULLETS_PER_SECTION[draftSection] ?? [0, Infinity]
  if (bullets.length < min || bullets.length > max) fail(file, p.start + 1, 'bullets', `${bullets.length} bullets, ${min}-${max} under ## ${draftSection}`)

  const seen = new Map()
  for (const b of bullets) {
    const at = b.start + 1
    if (RANK_MARK.test(b.lines[0].slice(2))) fail(file, at, 'rank mark', 'a bullet carries no rank mark')
    const text = plain(b.lines[0].slice(2))
    for (const name of keywordsIn(text, known)) {
      const canonical = known.find(n => n === name || n === `${name}.js`) ?? name
      if (seen.has(canonical)) fail(file, at, 'keyword repeated', `${canonical}, already in the bullet at line ${seen.get(canonical)}`)
      else seen.set(canonical, at)
    }
    const ands = (text.match(/\band\b/gi) ?? []).length
    if (ands > 2) fail(file, at, 'conjunctions', `${ands} "and", two at most`)
    const explanation = text.match(EXPLANATION)
    if (explanation) fail(file, at, 'explanation clause', `"${explanation[0]}"`)
    if (PLUS_JOIN.test(text)) fail(file, at, 'plus join', text.match(/\S*\+\S*/)[0])
    if (text.length > BULLET_CHARS_HARD) fail(file, at, 'bullet length', `${text.length} chars, ${BULLET_CHARS} aimed, ${BULLET_CHARS_HARD} at most`)
    if (sentences(text) > 2) fail(file, at, 'bullet length', `${sentences(text)} sentences, two at most`)
    if (/^(I|We)\b/.test(text)) fail(file, at, 'action verb', `starts with "${text.split(' ')[0]}"`)
    for (const [kind, re] of banned) {
      const m = text.match(re)
      if (m) fail(file, at, kind, m[0])
    }
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      const noun = sentence.match(COUNT_NOUN)
      if (noun && NUMBER.test(sentence) && !RATE.test(sentence)) fail(file, at, 'unjudgeable count', `a number next to "${noun[0]}"`)
    }
    const share = text.match(COMMIT_SHARE)
    if (share) fail(file, at, 'unjudgeable count', share[0])
    const acronym = acronymBesideExpansion(text)
    if (acronym) fail(file, at, 'acronym and expansion', acronym)
    checkKeywords(file, at, text, known)
  }
})
if (total > BULLETS_ON_PAGE) fail(file, 1, 'bullets', `${total} bullets, about ${BULLETS_ON_PAGE} fit the page`)

for (const f of failures) console.log(`FAIL  ${f}`)
console.log(failures.length ? `${failures.length} lint failures` : `PASS  lint: ${file} and ${pools.size} pools`)
process.exitCode = failures.length ? 1 : 0
