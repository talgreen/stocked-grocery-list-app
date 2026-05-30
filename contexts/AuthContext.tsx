'use client'

import { auth, googleProvider } from '@/lib/firebase'
import { ensureUserDoc } from '@/lib/db'
import {
  getRedirectResult,
  linkWithPopup,
  linkWithRedirect,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface AuthUser {
  uid: string
  isAnonymous: boolean
  displayName: string | null
  email: string | null
  photoURL: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL
  }
}

function persistProfile(user: User) {
  if (user.isAnonymous) return
  return ensureUserDoc({
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL
  })
}

// Use redirect-based sign-in when running as an installed/standalone PWA, where
// popups are unreliable. Otherwise prefer the smoother popup flow.
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  // Guards against signInAnonymously firing twice (React Strict Mode double-mount).
  const anonInFlight = useRef(false)

  useEffect(() => {
    // Auth is unavailable when Firebase env vars are missing (e.g. build/prerender).
    // Nothing to bootstrap in that case.
    if (!auth) {
      setLoading(false)
      return
    }
    // Local const so the non-null narrowing carries into the callbacks below.
    const authInstance = auth

    let unsub: (() => void) | undefined

    // Handle the return from a redirect-based sign-in/link before wiring up the
    // auth-state listener.
    getRedirectResult(authInstance)
      .then(result => {
        if (result?.user) {
          void persistProfile(result.user)
        }
      })
      .catch((error: unknown) => {
        if (error instanceof FirebaseError &&
            (error.code === 'auth/credential-already-in-use' ||
             error.code === 'auth/email-already-in-use')) {
          toast.error('חשבון Google זה כבר משויך. הרשימות שנוצרו כאורח לא הועברו.')
        } else {
          console.error('Redirect sign-in error:', error)
        }
      })
      .finally(() => {
        unsub = onAuthStateChanged(authInstance, currentUser => {
          if (currentUser) {
            anonInFlight.current = false
            setUser(toAuthUser(currentUser))
            setLoading(false)
          } else if (!anonInFlight.current) {
            // No session yet — bootstrap an anonymous one so every visitor has a uid.
            anonInFlight.current = true
            signInAnonymously(authInstance).catch(error => {
              console.error('Anonymous sign-in error:', error)
              anonInFlight.current = false
              setLoading(false)
            })
          }
        })
      })

    return () => {
      unsub?.()
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) return
    const useRedirect = isStandalone()
    const current = auth.currentUser

    try {
      // Anonymous user present: link to Google so any guest-created lists are preserved.
      if (current && current.isAnonymous) {
        if (useRedirect) {
          await linkWithRedirect(current, googleProvider)
          return
        }
        const result = await linkWithPopup(current, googleProvider)
        await persistProfile(result.user)
        return
      }

      // No user (rare) — straight sign-in.
      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider)
        return
      }
      const result = await signInWithPopup(auth, googleProvider)
      await persistProfile(result.user)
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        // The Google account already exists and can't be linked to the anon user.
        // Sign in to it directly (guest lists won't carry over — documented limitation).
        if (error.code === 'auth/credential-already-in-use' ||
            error.code === 'auth/email-already-in-use') {
          toast.error('חשבון Google זה כבר משויך. הרשימות שנוצרו כאורח לא הועברו.')
          if (useRedirect) {
            await signInWithRedirect(auth, googleProvider)
            return
          }
          const result = await signInWithPopup(auth, googleProvider)
          await persistProfile(result.user)
          return
        }
        // Popup blocked or dismissed — retry via redirect.
        if (error.code === 'auth/popup-blocked' ||
            error.code === 'auth/popup-closed-by-user' ||
            error.code === 'auth/cancelled-popup-request') {
          if (current && current.isAnonymous) {
            await linkWithRedirect(current, googleProvider)
          } else {
            await signInWithRedirect(auth, googleProvider)
          }
          return
        }
      }
      console.error('Google sign-in error:', error)
      toast.error('ההתחברות נכשלה, נסו שוב')
    }
  }, [])

  const signOutUser = useCallback(async () => {
    if (!auth) return
    // After sign-out, onAuthStateChanged re-bootstraps a fresh anonymous session.
    await signOut(auth)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
