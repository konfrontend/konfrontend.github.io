// The proposal State's scripts. `milestones` derives each milestone's price from its hours and the rate,
// and its due date from the start date and the hours per day: the next milestone starts where the last
// ended, with no review gap, and Saturday and Sunday carry no hours, so no due date falls on a weekend.
// `write-rate` writes the rate the person set into job.md through the Candidate contract, once, after the
// batched question; a refusal is printed on stdout with exit 0.
// CLI: node scripts/proposal.ts milestones --rate <n> --start <YYYY-MM-DD> --per-day <n> --hours <h,h,...>
//      node scripts/proposal.ts write-rate <candidate> --rate <n>
import { Refusal } from "./lib.ts";
import { writeRate } from "./candidate.ts";

export interface MilestoneInput { rate: number; start: string; perDay: number; hours: number[] }
export interface Milestone { n: number; hours: number; price: number; due: string }

const DAY = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;
const nextWorkday = (d: Date) => { let x = new Date(d.getTime() + DAY); while (isWeekend(x)) x = new Date(x.getTime() + DAY); return x; };

export function derive({ rate, start, perDay, hours }: MilestoneInput): { milestones: Milestone[]; total: number } {
  if (!(rate > 0)) throw new Error("the rate must be a positive number");
  if (!(perDay > 0)) throw new Error("the hours per day must be a positive number");
  hours.forEach((h, i) => { if (!(h > 0)) throw new Error(`milestone ${i + 1} needs a positive number of hours`); });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || Number.isNaN(Date.parse(`${start}T00:00:00Z`))) throw new Error(`the start must be a full date YYYY-MM-DD (got "${start}")`);
  let day = new Date(`${start}T00:00:00Z`);
  while (isWeekend(day)) day = new Date(day.getTime() + DAY);
  let left = perDay;
  const milestones = hours.map((h, i) => {
    let need = h;
    while (need > left) { need -= left; day = nextWorkday(day); left = perDay; }
    left -= need;
    return { n: i + 1, hours: h, price: h * rate, due: iso(day) };
  });
  return { milestones, total: milestones.reduce((s, m) => s + m.price, 0) };
}

const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const shortDate = (s: string) => { const d = new Date(`${s}T00:00:00Z`); return `${WEEKDAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; };

export function render({ milestones, total }: ReturnType<typeof derive>): string {
  const lines = milestones.map((m) => `${m.n}. ${m.hours} hours, ${money(m.price)}, due ${shortDate(m.due)} (${m.due})`);
  lines.push(`total: ${milestones.reduce((s, m) => s + m.hours, 0)} hours, ${money(total)}`);
  return lines.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [command, ...args] = process.argv.slice(2);
  const opt = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
  const usage = "usage: proposal.ts milestones --rate <n> --start <YYYY-MM-DD> --per-day <n> --hours <h,h,...> | proposal.ts write-rate <candidate> --rate <n>";
  if (command === "milestones") {
    const rate = opt("rate"), start = opt("start"), perDay = opt("per-day"), hours = opt("hours");
    if (!rate || !start || !perDay || !hours) { console.error(usage); process.exit(2); }
    try {
      console.log(render(derive({ rate: Number(rate), start, perDay: Number(perDay), hours: hours.split(",").map((h) => Number(h.trim())) })));
    } catch (e) { console.error(`autotriage: proposal milestones: ${(e as Error).message}`); process.exit(2); }
  } else if (command === "write-rate") {
    const rate = opt("rate");
    if (!args[0] || args[0].startsWith("--") || rate === undefined) { console.error(usage); process.exit(2); }
    try {
      console.log(writeRate(args[0], Number(rate)));
    } catch (e) {
      if (e instanceof Refusal) { console.log(e.message); process.exit(0); }
      throw e;
    }
  } else { console.error(usage); process.exit(2); }
}
