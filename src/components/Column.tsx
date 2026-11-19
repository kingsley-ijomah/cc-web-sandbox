import type { Status, Ticket } from '../types'
import { TicketCard } from './TicketCard'

interface Props {
  label: string
  tickets: Ticket[]
  onMove: (id: string, status: Status) => void
  onDelete: (id: string) => void
  onClear?: () => void
}

export function Column({ label, tickets, onMove, onDelete, onClear }: Props) {
  return (
    <section className="column" aria-label={label}>
      <h2>
        {label} <span className="count">{tickets.length}</span>
      </h2>
      {tickets.length === 0 ? (
        <p className="empty">No tickets</p>
      ) : (
        <ul>
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} onMove={onMove} onDelete={onDelete} />
          ))}
        </ul>
      )}
      {onClear && tickets.length > 0 && (
        <button type="button" className="danger clear-done" onClick={onClear}>
          Clear all done tickets
        </button>
      )}
    </section>
  )
}
