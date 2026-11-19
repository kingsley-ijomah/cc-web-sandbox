---
name: ship-ticket
description: Ships one ticket through the AI-DLC workflow — branch, plan, implement, test, review (with up to 2 fix loops), then commit and push. Input is a ticket ID and description, e.g. "TICK-1: add a ticket count to each column". Use when asked to ship, build or deliver a ticket, or when /ship-ticket is run. Does not open a pull request.
argument-hint: "<ticket-id>: <description>"
---

# /ship-ticket

Runs one ticket through the subagents in `.claude-disabled/agents/`: **planner → implementer → tester → reviewer**. You (the main session) orchestrate. The subagents do the work. Don't do their work yourself.

Input: `$ARGUMENTS`, in the form `<ticket-id>: <description>`.

## 0. Parse and check
- Split the input on the first `:` into `TICKET_ID` (e.g. `TICK-1`) and `DESCRIPTION`. If there's no ticket ID, stop and ask for one.
- Build `SLUG`: lowercase the description, keep 3–5 meaningful words, join with `-`, letters/digits/hyphens only (e.g. `add-ticket-count-column`).
- Run `git status --porcelain`. If the tree isn't clean, stop and report. Don't stash or discard anyone's work.

## a. Create the branch
```bash
git checkout -b claude/<TICKET_ID>-<SLUG>
```
If the branch already exists, stop and report instead of reusing or overwriting it.

## b. Run the agents in order
Call each with the Agent tool using its `subagent_type`. Pass the plan path to every agent after the planner. Wait for each to finish before starting the next.

1. **planner** — prompt: `Ticket <TICKET_ID>: <DESCRIPTION>. Write docs/plans/<TICKET_ID>.md.` Confirm the file exists.
2. **implementer** — prompt: `Implement docs/plans/<TICKET_ID>.md.`
3. **tester** — prompt: `Write tests for each acceptance criterion in docs/plans/<TICKET_ID>.md, then run npm test and npm run lint.`
4. **reviewer** — prompt: `Review the current diff against docs/plans/<TICKET_ID>.md. Tester report: <tester output>.`

Read the first line of the reviewer's output: `APPROVED` or `CHANGES REQUESTED`.

## c. Fix loop (at most 2 more rounds)
If `CHANGES REQUESTED`:
- Run **implementer** with the issues marked `implementer` (prompt: `Address these review issues for docs/plans/<TICKET_ID>.md: <issues>`). Skip it if every issue is for the tester.
- Run **tester** with the plan path and any issues marked `tester`.
- Run **reviewer** again.

Also route the tester's "Source bugs found" to the implementer in the next round.

Stop after 2 fix rounds (3 reviews total). If it's still not approved, **do not commit or push**. Leave the branch and working tree as they are and go to step e with verdict `CHANGES REQUESTED`.

## d. Commit and push (only when APPROVED)
1. Run `npm test` and `npm run lint` one last time (plus `npm run build` if types or config changed). If anything fails, don't commit; report it.
2. Stage the plan and the changed files by name (`git add docs/plans/<TICKET_ID>.md <files>`). Don't use `git add -A`, and never stage `.env`, `dist/` or `node_modules/`.
3. Commit with exactly this message format and **no AI attribution** (no `Co-Authored-By`, no "Generated with" line):
   ```bash
   git commit -m "<TICKET_ID>: <summary>"
   ```
   `<summary>` is a short imperative description of the change (usually the ticket description).
4. Push: `git push -u origin claude/<TICKET_ID>-<SLUG>`.

**Do not open a pull request.** The calling session or scheduled task does that.

## e. Final summary
End with:

```
Ticket:    <TICKET_ID>: <DESCRIPTION>
Branch:    claude/<TICKET_ID>-<SLUG> (pushed | not pushed)
Plan:      docs/plans/<TICKET_ID>.md
Files changed: <list from git diff --stat>
Tests:     <per-AC pass/fail, npm test result, npm run lint result>
Reviewer:  APPROVED | CHANGES REQUESTED (after <n> review rounds)
Open issues: <none, or the reviewer's remaining list>
Commit:    <sha and message, or "none">
```
