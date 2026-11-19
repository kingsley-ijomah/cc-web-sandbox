import { COLUMNS, type Status, type Ticket } from '../types'

interface Props {
  ticket: Ticket
  onMove: (id: string, status: Status) => void
  onDelete: (id: string) => void
}

export function TicketCard({ ticket, onMove, onDelete }: Props) {
  const index = COLUMNS.findIndex((c) => c.status === ticket.status)
  const prev = COLUMNS[index - 1]
  const next = COLUMNS[index + 1]

  return (
    <li className="ticket" aria-label={ticket.title}>
      <h3>{ticket.title}</h3>
      {ticket.description && <p>{ticket.description}</p>}
      <div className="ticket-actions">
        {prev && (
          <button type="button" onClick={() => onMove(ticket.id, prev.status)}>
            ← {prev.label}
          </button>
        )}
        {next && (
          <button type="button" onClick={() => onMove(ticket.id, next.status)}>
            {next.label} →
          </button>
        )}
        <button type="button" className="danger" onClick={() => onDelete(ticket.id)}>
          Delete
        </button>
      </div>
    </li>
  )
}
