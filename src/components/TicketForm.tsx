import { useState, type FormEvent } from 'react'

interface Props {
  onAdd: (title: string, description: string) => void
}

export function TicketForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, description.trim())
    setTitle('')
    setDescription('')
  }

  return (
    <form className="ticket-form" onSubmit={handleSubmit} aria-label="Add ticket">
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description (optional)
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </label>
      <button type="submit">Add ticket</button>
    </form>
  )
}
