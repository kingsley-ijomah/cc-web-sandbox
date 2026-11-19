# Mini Ticket Board

A small single-page ticket board built with Vite, React and TypeScript. It exists as a test bed for cloud coding agents.

## Features

- Three columns: **To Do**, **In Progress**, **Done**
- Add a ticket with a title and an optional description (new tickets land in To Do)
- Move tickets between columns with buttons
- Delete tickets
- Tickets are saved to `localStorage`, so they survive a page reload

No backend, no UI library, no drag-and-drop.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
```

## Run

```bash
npm run dev       # start the dev server (prints a local URL, usually http://localhost:5173)
npm run build     # type-check and build to dist/
npm run preview   # serve the production build locally
```

## Test and lint

```bash
npm test          # run the Vitest suite once
npm run lint      # run ESLint
```

## Project layout

```
src/
  App.tsx              board state and actions
  App.test.tsx         tests for add, move, delete and persistence
  storage.ts           localStorage load/save
  types.ts             Ticket type and column definitions
  components/          TicketForm, Column, TicketCard
  index.css            all styles (plain CSS)
  test/setup.ts        test setup (jest-dom matchers, cleanup)
```
