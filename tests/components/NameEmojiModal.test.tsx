import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NameEmojiModal from '@/components/NameEmojiModal'

describe('NameEmojiModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits the typed name with the default emoji', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <NameEmojiModal
        title="רשימה חדשה"
        submitLabel="צור רשימה"
        initialEmoji="🧳"
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    )

    await user.type(screen.getByPlaceholderText('שם'), 'טיול לאיטליה')
    await user.click(screen.getByRole('button', { name: 'צור רשימה' }))

    expect(onSubmit).toHaveBeenCalledWith('טיול לאיטליה', '🧳')
  })

  it('does not submit when the name is empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <NameEmojiModal
        title="רשימה חדשה"
        submitLabel="צור רשימה"
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'צור רשימה' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('exposes an emoji picker trigger', () => {
    render(
      <NameEmojiModal
        title="קטגוריה חדשה"
        submitLabel="הוסף קטגוריה"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByLabelText("בחירת אימוג'י")).toBeInTheDocument()
  })

  it('shows a delete action only in edit mode', () => {
    const onDelete = vi.fn()
    const { rerender } = render(
      <NameEmojiModal
        title="עריכת רשימה"
        submitLabel="שמור"
        initialName="חופשה"
        initialEmoji="🏖️"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
        onDelete={onDelete}
      />
    )

    expect(screen.getByTitle('מחיקה')).toBeInTheDocument()

    rerender(
      <NameEmojiModal
        title="רשימה חדשה"
        submitLabel="צור רשימה"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByTitle('מחיקה')).not.toBeInTheDocument()
  })
})
