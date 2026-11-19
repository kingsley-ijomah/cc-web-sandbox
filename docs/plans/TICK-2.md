# TICK-2: add a "Clear all done tickets" button to the Done column

## Goal
The Done column gets a button that removes every ticket in Done in one click. Tickets in To Do and In Progress are not touched, and the change is saved to `localStorage` like any other change.

## Decisions (edge cases)
- **Done column only.** The button never appears in To Do or In Progress.
- **Hidden when Done is empty** (not disabled). An empty column already shows "No tickets", so a disabled button would just add clutter, and hiding it keeps the empty state the same across all three columns. The button appears as soon as Done has at least one ticket and goes away once Done is empty again.
- **No confirmation dialog.** Deleting a single ticket has no confirmation today, so this stays consistent with that. The board is a small local test bed, and a `window.confirm` would make tests harder for little gain. The button uses the existing `danger` style so it reads as destructive.
- **Accessible name:** the button text is exactly `Clear all done tickets`, and the tests query it by that name. It must not contain `→` or `←`, and it must not contain a capitalised `Done`, because existing tests match move buttons with `/→/` and `/Done/`.

## Acceptance criteria
- AC1: With at least one ticket in Done, the Done column `region` contains a button named `Clear all done tickets`.
- AC2: The To Do and In Progress columns never contain that button, even when they hold tickets and Done is not empty.
- AC3: When Done is empty, the button is absent from the page (not disabled). This holds on an empty board, while tickets exist only in To Do or In Progress, and after the button has been used.
- AC4: Clicking the button removes every ticket in Done. Tickets in To Do and In Progress stay where they are and keep their order. The Done heading reads `Done 0` and the column shows "No tickets".
- AC5: After clicking, `localStorage` (`STORAGE_KEY`) holds only the tickets that were not in Done.

## Files to change
- `src/App.tsx`: add `clearDone()`, which calls `setTickets((prev) => prev.filter((t) => t.status !== 'done'))`. Pass `onClear={clearDone}` to the Done column only (`col.status === 'done' ? clearDone : undefined`). The existing `useEffect` already handles persistence; do not add any extra saving code.
- `src/components/Column.tsx`: add an optional prop `onClear?: () => void`. Render `<button type="button" className="danger clear-done" onClick={onClear}>Clear all done tickets</button>` only when `onClear && tickets.length > 0`. Put it inside the `<section>`, **after** the list or empty message and **outside** the `<h2>`, so the heading's accessible name (`Done <count>`) stays the same.
- `src/index.css`: add `.clear-done { margin-top: 12px; }`. Make no other style changes.
- `src/App.test.tsx`: the tester adds the tests below. This file belongs to the tester; the implementer must not edit it.
- No changes to `types.ts`, `storage.ts`, `TicketCard.tsx` or `TicketForm.tsx`.

## Test plan
Use the existing helpers `column(name)`, `heading(name, count)` and `addTicket(title)`. To seed a mixed board, write to `localStorage.setItem(STORAGE_KEY, JSON.stringify([...]))` before `render(<App />)`. A good seed is: `todo` "Todo A", `in-progress` "Doing B", `done` "Done C", `done` "Done D". Suggested helper:

```ts
const clearName = 'Clear all done tickets'
```

- AC1, `shows the clear button in Done when it has tickets`: use the seeded board and assert `within(column('Done')).getByRole('button', { name: clearName })`.
- AC2, `does not show the clear button in other columns`: use the seeded board and assert `within(column('To Do')).queryByRole('button', { name: clearName })` and the same query for `In Progress` are both `null`.
- AC3, `hides the clear button when Done is empty`: (a) on an empty board, assert `screen.queryByRole('button', { name: clearName })` is `null`; (b) add a ticket and move it to In Progress, then assert it is still `null`.
- AC4, `clears only done tickets`: on the seeded board, click the button. Assert "Done C" and "Done D" are gone, "Todo A" is still in To Do and "Doing B" is still in In Progress. Assert `heading('Done', 0)`, `within(column('Done')).getByText('No tickets')`, and that the button is now absent (also covers AC3).
- AC5, `persists the cleared board`: on the seeded board, click the button, parse `localStorage.getItem(STORAGE_KEY)`, and assert it has length 2 and contains no ticket with `status: 'done'`.

Run `npm test` and `npm run lint`, and both must pass. Also run `npm run build`, because `Column`'s props type changes.

## Risks
- **Heading name:** if the button ends up inside the `<h2>`, `heading('Done', n)` breaks (tests from TICK-1). Keep it outside the heading.
- **Existing regex queries:** the existing tests use `getByRole('button', { name: /In Progress/ })` (unscoped, in "moves a ticket back"), `/Done/` (scoped to In Progress), and `/→/` (scoped to Done, expected absent). The chosen label avoids all of these. Do not rename it to something like "Clear Done →".
- **No undo:** clearing cannot be undone, and there is no confirmation. This is accepted for consistency with single delete, and a later ticket could add undo or a confirm.
- **Out of scope:** clearing other columns, bulk selection, a confirmation dialog, undo, a count shown in the button label, and any change to storage format.
