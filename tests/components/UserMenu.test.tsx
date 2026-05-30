import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserMenu from '@/components/UserMenu'
import { useAuth } from '@/contexts/AuthContext'

// useAuth is mocked globally in tests/setup.ts; we override its return per test.
const mockedUseAuth = vi.mocked(useAuth)

const signInWithGoogle = vi.fn(() => Promise.resolve())
const signOutUser = vi.fn(() => Promise.resolve())

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UserMenu', () => {
  it('shows a sign-in button for anonymous users', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'anon', isAnonymous: true, displayName: null, email: null, photoURL: null },
      loading: false,
      signInWithGoogle,
      signOutUser,
    })

    render(<UserMenu />)

    const button = screen.getByTitle('התחברות עם Google')
    expect(button).toBeInTheDocument()

    await userEvent.click(button)
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('shows an avatar with initials for a signed-in Google user', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        uid: 'u1',
        isAnonymous: false,
        displayName: 'Tal Greenshpan',
        email: 'tal@example.com',
        photoURL: null,
      },
      loading: false,
      signInWithGoogle,
      signOutUser,
    })

    render(<UserMenu />)

    // No sign-in CTA when authenticated.
    expect(screen.queryByTitle('התחברות עם Google')).not.toBeInTheDocument()
    // Initials fallback rendered when there's no photo.
    expect(screen.getByText('TG')).toBeInTheDocument()
  })

  it('renders a loading placeholder while auth bootstraps', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signInWithGoogle,
      signOutUser,
    })

    const { container } = render(<UserMenu />)
    expect(screen.queryByTitle('התחברות עם Google')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
