# TICK-1: show a ticket count next to each column title

## Goal
Each column heading shows how many tickets are in that column, e.g. "To Do 2", and the number updates as tickets are added, moved and deleted.

## Current state (read before implementing)
`src/components/Column.tsx` already renders the count inside the column heading:

```tsx
<h2>
  {label} <span className="count">{tickets.length}</span>
</h2>
```

and `src/index.css` already styles `.count`. The visible behaviour the ticket asks for is in place; what is missing is test coverage. The implementer should verify this and make **no source change** unless the count turns out to be absent or wrong. Do not add extra markup (aria-labels, visually hidden text, pluralised words) to the heading.

## Acceptance criteria
The count is part of the `<h2>` heading text, so its accessible name is `<column label> <count>` with a single space (e.g. `To Do 0`). All criteria are checked through that heading, scoped to the column `region`.

- AC1: On an empty board, every column heading reads `To Do 0`, `In Progress 0` and `Done 0`.
- AC2: After adding two tickets, the To Do heading reads `To Do 2`; In Progress and Done still read `0`.
- AC3: After moving a ticket from To Do to In Progress, the To Do heading decrements and the In Progress heading increments (e.g. `To Do 1`, `In Progress 1`).
- AC4: After deleting a ticket, the heading of its column decrements by one.
- AC5: Tickets restored from `localStorage` are counted on first render (seed storage with one `todo` and two `done` tickets; expect `To Do 1`, `In Progress 0`, `Done 2`).

## Files to change
- `src/components/Column.tsx` — no change expected; count is already rendered in the `<h2>`. Only touch it if the count is missing.
- `src/index.css` — no change expected; `.count` already styled.
- `src/App.test.tsx` — tester adds the tests below (tester-owned; the implementer must not edit it).

## Test plan
Use the existing helpers in `src/App.test.tsx` (`column(name)` returns the `region`; `addTicket(title)` fills and submits the form). Suggested helper:

```ts
function heading(name: string, count: number) {
  return within(column(name)).getByRole('heading', { level: 2, name: `${name} ${count}` })
}
```

- AC1 → `shows a zero count in every column on an empty board`: render `<App />`; assert `heading('To Do', 0)`, `heading('In Progress', 0)`, `heading('Done', 0)` are in the document.
- AC2 → `counts added tickets in To Do`: add two tickets; assert `heading('To Do', 2)`, `heading('In Progress', 0)`, `heading('Done', 0)`.
- AC3 → `updates counts when a ticket moves`: add two tickets, click the `In Progress →` button on one (scope with `within(column('To Do'))`); assert `heading('To Do', 1)` and `heading('In Progress', 1)`.
- AC4 → `decrements the count when a ticket is deleted`: add two tickets, click `Delete` inside the `listitem` named for one of them; assert `heading('To Do', 1)`.
- AC5 → `counts tickets restored from localStorage`: `localStorage.setItem(STORAGE_KEY, JSON.stringify([...]))` with one `todo` and two `done` tickets before rendering; assert `heading('To Do', 1)`, `heading('In Progress', 0)`, `heading('Done', 2)`.

Run `npm test` and `npm run lint`; both must pass.

## Risks
- The heading's accessible name depends on the exact `{label} <span>{count}</span>` layout (one space between label and number). Changing that markup later will break these tests; keep it stable or update the tests.
- The `region` is named via `aria-label={label}` (no count), so existing `column('To Do')` queries are unaffected. Do not move the count into `aria-label` of the section, as that would break every existing test.
- Out of scope: pluralised wording ("2 tickets"), a total count across the board, badge styling changes, showing the count in the browser title, or any change to `App.tsx`, `types.ts` or `storage.ts`.
