export type Status = 'todo' | 'in-progress' | 'done'

export interface Ticket {
  id: string
  title: string
  description: string
  status: Status
}

export const COLUMNS: { status: Status; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
]
