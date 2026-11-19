# CLAUDE.md

Mini Ticket Board: a single-page React app with three columns (To Do, In Progress, Done). Tickets can be added, moved with buttons, and deleted, and are persisted to `localStorage`. It is a test bed for cloud coding agents, so keep it small and simple.

## Rule

**Run `npm test` and `npm run lint` before finishing any change.** Both must pass. If you touch types or config, also run `npm run build`.

## Stack

- Vite + React + TypeScript (strict mode)
- Vitest + React Testing Library (`jsdom` environment, globals enabled)
- ESLint (flat config: `typescript-eslint`, `react-hooks`, `react-refresh`)
- npm
- Plain CSS in `src/index.css`. No UI library, no backend, no drag-and-drop.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm test` | Run tests once (`vitest run`) |
| `npm run lint` | Run ESLint on the project |

## Folder layout

```
index.html             Vite entry HTML
vite.config.ts         Vite + Vitest config
eslint.config.js       ESLint flat config
tsconfig*.json         TypeScript project references (app + node)
src/
  main.tsx             React entry point
  App.tsx              Board state; add/move/delete; saves on every change
  App.test.tsx         Behaviour tests
  storage.ts           loadTickets/saveTickets, STORAGE_KEY; validates stored data
  types.ts             Ticket, Status, COLUMNS (column order and labels)
  components/
    TicketForm.tsx     Title + optional description form
    Column.tsx         One column and its ticket list
    TicketCard.tsx     A ticket with move/delete buttons
  index.css            All styles
  test/setup.ts        jest-dom matchers; clears DOM and localStorage after each test
```

## Conventions

- State lives in `App.tsx`; components receive data and callbacks via props.
- Column order comes from `COLUMNS` in `types.ts`. Move buttons go to the previous/next column.
- Tests query by accessible role and label (columns are `region`s named after the column, tickets are `listitem`s named after the title). Keep those labels stable or update the tests.
- Add or update tests in `src/*.test.tsx` for any behaviour change.

## AI-DLC workflow

Tickets can be shipped by a fixed pipeline of Claude Code subagents (`.claude/agents/`), orchestrated by the `ship-ticket` skill (`.claude/skills/ship-ticket/SKILL.md`).

| Agent | Tools | Job |
| --- | --- | --- |
| `planner` | Read, Grep, Glob, Write | Writes `docs/plans/<ticket-id>.md`: goal, acceptance criteria (AC1, AC2, …), files to change, test plan, risks. Never edits source. |
| `implementer` | Read, Edit, Write, Grep, Glob, Bash | Implements exactly what the plan says, following this file. No tests, nothing beyond the plan. |
| `tester` | Read, Edit, Write, Grep, Glob, Bash | Writes Vitest tests per acceptance criterion, runs `npm test` and `npm run lint`, reports pass/fail per AC. Edits only test files; reports source bugs. |
| `reviewer` | Read, Grep, Glob, Bash | Reviews the diff against the plan for correctness, simplicity and coverage. Outputs `APPROVED` or `CHANGES REQUESTED`. Read-only. |

Run it from a clean working tree:

```
/ship-ticket TICK-1: add a ticket count to each column
```

The skill creates `claude/<ticket-id>-<short-slug>`, runs planner → implementer → tester → reviewer, and loops implementer → tester → reviewer up to 2 more times if changes are requested. When approved, it commits as `<ticket-id>: <summary>` (no AI attribution) and pushes the branch. If it's still not approved, it stops without committing. It never opens a PR; the calling session or scheduled task does that. Plans are kept in `docs/plans/`.
