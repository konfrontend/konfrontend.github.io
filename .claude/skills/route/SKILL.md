---
name: route
description: Drive one Job through the whole Route in one sitting - intake, triage, the Checkpoint, proposal, verify.
disable-model-invocation: true
argument-hint: "[paste the Job here or in the next message]"
---
!`node ${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/autotriage/scripts/guard.ts route`

A guard line above that starts with `autotriage:` and says `refused` is the answer: print it verbatim and stop; it names the fix.

The Route is one sitting: the human pastes a Job, reads a one-screen triage summary, answers go or no-go at the Checkpoint, and receives the Letter. Each step is its own skill; invoke them in order with the Skill tool. Nothing about the Job is stored: the Job, its fields, the Verdict and the Letter live only in this session, and each step reads them from it.

## Steps

1. **Collect the Job.** The argument or the next message carries the paste: the posting body, usually behind a parameter line with country, budget, hours, and duration. Done when the paste is in hand; `intake` reads the fields and asks for what is missing.
2. **Intake.** Invoke `route-intake` with the collected material as its argument. Done when it has printed the Job's fields.
3. **Triage and the Letter.** Invoke `route-triage`. It prints the summary, asks the human for go or no-go, and on `go` invokes `route-proposal` itself on both routes, which invokes `route-verify` in turn. A `no-go` ends the Route: say so and stop. `verify` output ends with the Letter in a code block, ready to paste. The Route ends when the human has sent it, on the employment route with the Version they chose.

A step that answers with a line starting `autotriage:` and saying `refused` has refused. Print that line verbatim and stop; it names the fix.
