import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { STORAGE_KEY } from './storage'
import type { Ticket } from './types'

function column(name: string) {
  return screen.getByRole('region', { name })
}

async function addTicket(title: string, description = '') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Title'), title)
  if (description) await user.type(screen.getByLabelText(/Description/), description)
  await user.click(screen.getByRole('button', { name: 'Add ticket' }))
  return user
}

describe('Mini Ticket Board', () => {
  it('adds a ticket with title and description to the To Do column', async () => {
    render(<App />)
    await addTicket('Write docs', 'Cover setup steps')

    const todo = column('To Do')
    expect(within(todo).getByRole('heading', { name: 'Write docs' })).toBeInTheDocument()
    expect(within(todo).getByText('Cover setup steps')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveValue('')
  })

  it('ignores a whitespace-only title', async () => {
    render(<App />)
    await addTicket('   ')

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('moves a ticket forward through every column', async () => {
    render(<App />)
    const user = await addTicket('Fix bug')

    await user.click(within(column('To Do')).getByRole('button', { name: /In Progress/ }))
    expect(within(column('To Do')).queryByText('Fix bug')).not.toBeInTheDocument()
    expect(within(column('In Progress')).getByText('Fix bug')).toBeInTheDocument()

    await user.click(within(column('In Progress')).getByRole('button', { name: /Done/ }))
    expect(within(column('Done')).getByText('Fix bug')).toBeInTheDocument()
    expect(within(column('Done')).queryByRole('button', { name: /→/ })).not.toBeInTheDocument()
  })

  it('moves a ticket back to the previous column', async () => {
    render(<App />)
    const user = await addTicket('Review PR')

    await user.click(screen.getByRole('button', { name: /In Progress/ }))
    await user.click(within(column('In Progress')).getByRole('button', { name: /To Do/ }))

    expect(within(column('To Do')).getByText('Review PR')).toBeInTheDocument()
    expect(within(column('In Progress')).queryByText('Review PR')).not.toBeInTheDocument()
  })

  it('deletes only the chosen ticket', async () => {
    render(<App />)
    const user = await addTicket('Keep me')
    await addTicket('Remove me')

    const card = screen.getByRole('listitem', { name: 'Remove me' })
    await user.click(within(card).getByRole('button', { name: 'Delete' }))

    expect(screen.queryByText('Remove me')).not.toBeInTheDocument()
    expect(screen.getByText('Keep me')).toBeInTheDocument()
  })

  it('saves tickets and their columns to localStorage', async () => {
    render(<App />)
    const user = await addTicket('Persist me', 'details')
    await user.click(screen.getByRole('button', { name: /In Progress/ }))

    const stored: Ticket[] = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ title: 'Persist me', description: 'details', status: 'in-progress' })
  })

  it('restores saved tickets on reload', () => {
    const saved: Ticket[] = [
      { id: '1', title: 'Saved todo', description: '', status: 'todo' },
      { id: '2', title: 'Saved done', description: '', status: 'done' },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    render(<App />)

    expect(within(column('To Do')).getByText('Saved todo')).toBeInTheDocument()
    expect(within(column('Done')).getByText('Saved done')).toBeInTheDocument()
  })

  it('starts empty when saved data is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')

    render(<App />)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getAllByText('No tickets')).toHaveLength(3)
  })
})
