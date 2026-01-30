import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GroceryItem from '@/components/GroceryItem'
import { Item } from '@/types/item'

const mockItem: Item = {
  id: 1,
  name: 'חלב',
  purchased: false,
  comment: 'טרי',
  photo: null,
  categoryId: 1,
  lastPurchaseAt: null,
  expectedGapDays: null,
  gapVariance: null,
  decayedCount: 0,
  purchaseCount: 0,
  snoozeUntil: null,
}

describe('GroceryItem', () => {
  it('renders item name', () => {
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <GroceryItem
        item={mockItem}
        categoryId={1}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )

    expect(screen.getByText('חלב')).toBeInTheDocument()
  })

  it('renders item comment when present', () => {
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <GroceryItem
        item={mockItem}
        categoryId={1}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )

    expect(screen.getByText(/טרי/)).toBeInTheDocument()
  })

  it('calls onToggle when checkbox is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <GroceryItem
        item={mockItem}
        categoryId={1}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )

    const buttons = screen.getAllByRole('button')
    const checkbox = buttons[0] // First button is the checkbox
    await user.click(checkbox)

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows purchased state correctly', () => {
    const purchasedItem = { ...mockItem, purchased: true }
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <GroceryItem
        item={purchasedItem}
        categoryId={1}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )

    const itemName = screen.getByText('חלב')
    expect(itemName).toHaveClass('line-through')
  })

  it('shows delete confirmation on first delete click', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <GroceryItem
        item={mockItem}
        categoryId={1}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons[deleteButtons.length - 1]
    await user.click(deleteButton)

    expect(screen.getByText('למחוק?')).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('displays quantity when set', () => {
    const itemWithQuantity = { ...mockItem, quantity: 3 }
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <GroceryItem
        item={itemWithQuantity}
        categoryId={1}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays quantity of 1 when explicitly set', () => {
    const itemWithQuantity = { ...mockItem, quantity: 1 }
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <GroceryItem
        item={itemWithQuantity}
        categoryId={1}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('does not display quantity badge when quantity is not set', () => {
    const itemWithoutQuantity = { ...mockItem, quantity: null }
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()

    render(
      <GroceryItem
        item={itemWithoutQuantity}
        categoryId={1}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    )

    // The quantity badge should not be present
    const quantityBadge = screen.queryByText(/^\d+$/)
    expect(quantityBadge).not.toBeInTheDocument()
  })
})
