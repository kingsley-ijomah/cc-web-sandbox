import { useEffect, useState } from 'react'
import { Column } from './components/Column'
import { TicketForm } from './components/TicketForm'
import { loadTickets, saveTickets } from './storage'
import { COLUMNS, type Status, type Ticket } from './types'

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>(loadTickets)

  useEffect(() => {
    saveTickets(tickets)
  }, [tickets])

  function addTicket(title: string, description: string) {
    setTickets((prev) => [...prev, { id: crypto.randomUUID(), title, description, status: 'todo' }])
  }

  function moveTicket(id: string, status: Status) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  function deleteTicket(id: string) {
    setTickets((prev) => prev.filter((t) => t.id !== id))
  }

  function clearDone() {
    setTickets((prev) => prev.filter((t) => t.status !== 'done'))
  }

  return (
    <main className="app">
      <h1>Mini Ticket Board</h1>
      <TicketForm onAdd={addTicket} />
      <div className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            label={col.label}
            tickets={tickets.filter((t) => t.status === col.status)}
            onMove={moveTicket}
            onDelete={deleteTicket}
            onClear={col.status === 'done' ? clearDone : undefined}
          />
        ))}
      </div>
    </main>
  )
}
