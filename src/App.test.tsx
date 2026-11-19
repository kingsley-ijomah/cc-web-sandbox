import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { STORAGE_KEY } from './storage'
import type { Ticket } from './types'

function column(name: string) {
  return screen.getByRole('region', { name })
}

function heading(name: string, count: number) {
  return within(column(name)).getByRole('heading', { level: 2, name: `${name} ${count}` })
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

  it('AC1: shows a zero count in every column on an empty board', () => {
    render(<App />)

    expect(heading('To Do', 0)).toBeInTheDocument()
    expect(heading('In Progress', 0)).toBeInTheDocument()
    expect(heading('Done', 0)).toBeInTheDocument()
  })

  it('AC2: counts added tickets in To Do', async () => {
    render(<App />)
    await addTicket('First')
    await addTicket('Second')

    expect(heading('To Do', 2)).toBeInTheDocument()
    expect(heading('In Progress', 0)).toBeInTheDocument()
    expect(heading('Done', 0)).toBeInTheDocument()
  })

  it('AC3: updates counts when a ticket moves', async () => {
    render(<App />)
    const user = await addTicket('First')
    await addTicket('Second')

    const card = within(column('To Do')).getByRole('listitem', { name: 'First' })
    await user.click(within(card).getByRole('button', { name: /In Progress/ }))

    expect(heading('To Do', 1)).toBeInTheDocument()
    expect(heading('In Progress', 1)).toBeInTheDocument()
  })

  it('AC4: decrements the count when a ticket is deleted', async () => {
    render(<App />)
    const user = await addTicket('First')
    await addTicket('Second')

    const card = screen.getByRole('listitem', { name: 'Second' })
    await user.click(within(card).getByRole('button', { name: 'Delete' }))

    expect(heading('To Do', 1)).toBeInTheDocument()
  })

  it('AC5: counts tickets restored from localStorage', () => {
    const saved: Ticket[] = [
      { id: '1', title: 'Saved todo', description: '', status: 'todo' },
      { id: '2', title: 'Saved done', description: '', status: 'done' },
      { id: '3', title: 'Another done', description: '', status: 'done' },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    render(<App />)

    expect(heading('To Do', 1)).toBeInTheDocument()
    expect(heading('In Progress', 0)).toBeInTheDocument()
    expect(heading('Done', 2)).toBeInTheDocument()
  })

  describe('TICK-2: clear all done tickets', () => {
    const clearName = 'Clear all done tickets'
    const seed: Ticket[] = [
      { id: '1', title: 'Todo A', description: '', status: 'todo' },
      { id: '2', title: 'Doing B', description: '', status: 'in-progress' },
      { id: '3', title: 'Done C', description: '', status: 'done' },
      { id: '4', title: 'Done D', description: '', status: 'done' },
    ]

    function renderSeeded(tickets: Ticket[] = seed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
      return render(<App />)
    }

    function titlesIn(name: string) {
      return within(column(name))
        .queryAllByRole('listitem')
        .map((li) => li.getAttribute('aria-label'))
    }

    it('AC1: shows the clear button in Done when it has tickets', () => {
      renderSeeded()

      expect(within(column('Done')).getByRole('button', { name: clearName })).toBeInTheDocument()
    })

    it('AC1: shows the clear button after a ticket is moved into Done', async () => {
      render(<App />)
      const user = await addTicket('Ship it')
      await user.click(within(column('To Do')).getByRole('button', { name: /In Progress/ }))
      expect(screen.queryByRole('button', { name: clearName })).not.toBeInTheDocument()

      await user.click(within(column('In Progress')).getByRole('button', { name: /Done/ }))
      expect(within(column('Done')).getByRole('button', { name: clearName })).toBeInTheDocument()
    })

    it('AC2: does not show the clear button in other columns', () => {
      renderSeeded()

      expect(within(column('To Do')).queryByRole('button', { name: clearName })).toBeNull()
      expect(within(column('In Progress')).queryByRole('button', { name: clearName })).toBeNull()
      expect(screen.getAllByRole('button', { name: clearName })).toHaveLength(1)
    })

    it('AC3: hides the clear button when Done is empty', async () => {
      render(<App />)
      expect(screen.queryByRole('button', { name: clearName })).toBeNull()

      const user = await addTicket('Only todo')
      expect(screen.queryByRole('button', { name: clearName })).toBeNull()

      await user.click(within(column('To Do')).getByRole('button', { name: /In Progress/ }))
      expect(within(column('In Progress')).getByText('Only todo')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: clearName })).toBeNull()
    })

    it('AC3: hides the clear button when the last done ticket is deleted', async () => {
      const user = userEvent.setup()
      renderSeeded([{ id: '1', title: 'Lone done', description: '', status: 'done' }])

      const card = screen.getByRole('listitem', { name: 'Lone done' })
      await user.click(within(card).getByRole('button', { name: 'Delete' }))

      expect(screen.queryByRole('button', { name: clearName })).toBeNull()
    })

    it('AC4: clears only done tickets', async () => {
      const user = userEvent.setup()
      renderSeeded([
        { id: '1', title: 'Todo A', description: '', status: 'todo' },
        { id: '5', title: 'Todo E', description: '', status: 'todo' },
        { id: '3', title: 'Done C', description: '', status: 'done' },
        { id: '2', title: 'Doing B', description: '', status: 'in-progress' },
        { id: '4', title: 'Done D', description: '', status: 'done' },
        { id: '6', title: 'Doing F', description: '', status: 'in-progress' },
      ])

      await user.click(within(column('Done')).getByRole('button', { name: clearName }))

      expect(screen.queryByText('Done C')).not.toBeInTheDocument()
      expect(screen.queryByText('Done D')).not.toBeInTheDocument()
      expect(titlesIn('To Do')).toEqual(['Todo A', 'Todo E'])
      expect(titlesIn('In Progress')).toEqual(['Doing B', 'Doing F'])
      expect(heading('To Do', 2)).toBeInTheDocument()
      expect(heading('In Progress', 2)).toBeInTheDocument()
      expect(heading('Done', 0)).toBeInTheDocument()
      expect(within(column('Done')).getByText('No tickets')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: clearName })).toBeNull()
    })

    it('AC5: persists the cleared board', async () => {
      const user = userEvent.setup()
      renderSeeded()

      await user.click(within(column('Done')).getByRole('button', { name: clearName }))

      const stored: Ticket[] = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored).toHaveLength(2)
      expect(stored.some((t) => t.status === 'done')).toBe(false)
      expect(stored).toEqual([seed[0], seed[1]])
    })

    it('AC5: the cleared board survives a reload', async () => {
      const user = userEvent.setup()
      const { unmount } = renderSeeded()

      await user.click(within(column('Done')).getByRole('button', { name: clearName }))
      unmount()
      render(<App />)

      expect(heading('Done', 0)).toBeInTheDocument()
      expect(within(column('To Do')).getByText('Todo A')).toBeInTheDocument()
      expect(within(column('In Progress')).getByText('Doing B')).toBeInTheDocument()
    })
  })
})
