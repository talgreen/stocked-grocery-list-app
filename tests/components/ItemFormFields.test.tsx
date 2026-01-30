import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemFormFields from '@/components/ItemFormFields'
import { Category } from '@/types/categories'

const mockCategories: Category[] = [
  { id: 1, name: 'מוצרי חלב', emoji: '🥛', items: [] },
  { id: 2, name: 'ירקות', emoji: '🥬', items: [] },
]

describe('ItemFormFields', () => {
  it('renders quantity input field', () => {
    render(
      <ItemFormFields
        itemName=""
        onItemNameChange={vi.fn()}
        comment=""
        onCommentChange={vi.fn()}
        quantity=""
        onQuantityChange={vi.fn()}
        categoryId="1"
        onCategoryChange={vi.fn()}
        categories={mockCategories}
        showCategorySelector={true}
      />
    )

    expect(screen.getByPlaceholderText('כמות')).toBeInTheDocument()
  })

  it('calls onQuantityChange when quantity input changes', async () => {
    const user = userEvent.setup()
    const onQuantityChange = vi.fn()

    render(
      <ItemFormFields
        itemName=""
        onItemNameChange={vi.fn()}
        comment=""
        onCommentChange={vi.fn()}
        quantity=""
        onQuantityChange={onQuantityChange}
        categoryId="1"
        onCategoryChange={vi.fn()}
        categories={mockCategories}
        showCategorySelector={true}
      />
    )

    const quantityInput = screen.getByPlaceholderText('כמות')
    await user.type(quantityInput, '5')

    expect(onQuantityChange).toHaveBeenCalledWith('5')
  })

  it('displays the quantity value', () => {
    render(
      <ItemFormFields
        itemName=""
        onItemNameChange={vi.fn()}
        comment=""
        onCommentChange={vi.fn()}
        quantity="3"
        onQuantityChange={vi.fn()}
        categoryId="1"
        onCategoryChange={vi.fn()}
        categories={mockCategories}
        showCategorySelector={true}
      />
    )

    const quantityInput = screen.getByPlaceholderText('כמות') as HTMLInputElement
    expect(quantityInput.value).toBe('3')
  })

  it('renders comment input field', () => {
    render(
      <ItemFormFields
        itemName=""
        onItemNameChange={vi.fn()}
        comment=""
        onCommentChange={vi.fn()}
        quantity=""
        onQuantityChange={vi.fn()}
        categoryId="1"
        onCategoryChange={vi.fn()}
        categories={mockCategories}
        showCategorySelector={true}
      />
    )

    expect(screen.getByPlaceholderText('הערה (אופציונלי)')).toBeInTheDocument()
  })

  it('renders item name input field', () => {
    render(
      <ItemFormFields
        itemName=""
        onItemNameChange={vi.fn()}
        comment=""
        onCommentChange={vi.fn()}
        quantity=""
        onQuantityChange={vi.fn()}
        categoryId="1"
        onCategoryChange={vi.fn()}
        categories={mockCategories}
        showCategorySelector={true}
      />
    )

    expect(screen.getByPlaceholderText('שם הפריט')).toBeInTheDocument()
  })
})
