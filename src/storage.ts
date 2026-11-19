import type { Status, Ticket } from './types'

export const STORAGE_KEY = 'mini-ticket-board:tickets'

const STATUSES: Status[] = ['todo', 'in-progress', 'done']

function isTicket(value: unknown): value is Ticket {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.description === 'string' &&
    STATUSES.includes(t.status as Status)
  )
}

export function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isTicket) : []
  } catch {
    return []
  }
}

export function saveTickets(tickets: Ticket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
  } catch {
    // Storage may be full or unavailable (e.g. private mode); the board still works in memory.
  }
}
