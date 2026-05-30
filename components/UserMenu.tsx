'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || ''
  if (!source) return '?'
  const parts = source.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export default function UserMenu() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth()

  // Auth still bootstrapping — show a neutral placeholder.
  if (loading) {
    return <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" aria-hidden />
  }

  // Anonymous (or no profile) — offer Google sign-in.
  if (!user || user.isAnonymous) {
    return (
      <button
        onClick={() => void signInWithGoogle()}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
        title="התחברות עם Google"
      >
        <LogIn className="w-5 h-5" />
      </button>
    )
  }

  // Signed in with Google — avatar + dropdown.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-9 h-9 rounded-full overflow-hidden bg-[#FFB74D]/20 flex items-center justify-center text-sm font-bold text-gray-700 hover:ring-2 hover:ring-[#FFB74D]/50 transition-all duration-200"
          title={user.displayName || user.email || 'חשבון'}
        >
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span>{initials(user.displayName, user.email)}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex flex-col truncate text-right">
            {user.displayName && <span className="text-sm font-medium truncate">{user.displayName}</span>}
            {user.email && <span className="text-xs text-gray-500 truncate">{user.email}</span>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOutUser()} className="gap-2 cursor-pointer">
          <LogOut className="w-4 h-4" />
          <span>התנתקות</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
