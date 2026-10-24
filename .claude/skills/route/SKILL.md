---
name: route
description: Drive one Job through the whole Route in one sitting - intake, triage, the Checkpoint, version on the employment route, proposal, verify.
disable-model-invocation: true
argument-hint: "[paste the Job here or in the next message]"
---
!`node $CLAUDE_PROJECT_DIR/autotriage/scripts/guard.ts route`

A guard line above that starts with `autotriage:` and says `refused` is the answer: print it verbatim and stop; it names the fix.

The Route is one sitting: the human pastes a Job, reads a one-screen triage summary, answers go or no-go at the Checkpoint, and receives the Letter. Each State is its own skill; invoke them in order with the Skill tool and forward the Candidate folder name between them. The guards refuse a State out of order in both this mode and manual mode.

## Steps

1. **Collect the Job.** The argument or the next message carries the paste: the posting body, usually behind a parameter line with country, budget, hours, and duration. Done when the paste is in hand; `intake` reads the fields and asks for what is missing.
2. **Intake.** Invoke `route-intake` with the collected material as its argument. Its last line names the Candidate folder (`YYYY-MM-DD-<slug>`). Done when that folder name is in hand.
3. **Triage and the Letter.** Invoke `route-triage <candidate>`. It prints the summary, asks the human for go or no-go, writes the Verdict into `job.md`, and on `go` invokes `route-proposal <candidate>` itself on the freelance route, which invokes `route-verify <candidate>` in turn. On the employment route it invokes `route-version <candidate>` instead, which writes `letter.md` empty, names the Version sent (the general one, or `resume-version` writes `version.md` on `--tailor`) and names the next command; then invoke `route-proposal <candidate>` yourself, unless the human sends the Version without a Letter: then the Route ends after `version`. A `no-go` ends the Route: say so and stop. `verify` output ends with the Letter in a code block, ready to paste. The Route ends when the human has sent it; `resume-pdf` renders the Version sent, and the human sets `outcome: sent` in `job.md`.

A State that answers with a line starting `autotriage:` and saying `refused` has refused. Print that line verbatim and stop; it names the fix.
