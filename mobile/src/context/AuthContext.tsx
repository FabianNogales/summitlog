import { createContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import {
  getCurrentSession,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
} from '../services/auth.service'
import {
  createProfile,
  getProfileById,
  updateProfile,
} from '../services/profile.service'
import type { Profile } from '../types/profile'

interface RegisterParams {
  email: string
  password: string
  username: string
  fullName?: string
}

interface UpdateMyProfileParams {
  username: string
  full_name?: string | null
  bio?: string | null
  avatar_url?: string | null
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (params: RegisterParams) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateMyProfile: (params: UpdateMyProfileParams) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    try {
      const currentProfile = await getProfileById(userId)
      setProfile(currentProfile)
    } catch {
      setProfile(null)
    }
  }

  async function applySession(session: Session | null) {
    const sessionUser = session?.user ?? null

    setUser(sessionUser)

    if (!sessionUser) {
      setProfile(null)
      return
    }

    await loadProfile(sessionUser.id)
  }

  async function signIn(email: string, password: string) {
    const authData = await signInWithEmail(email, password)
    await applySession(authData.session)
  }

  async function signUp(params: RegisterParams) {
    const authData = await signUpWithEmail(params.email, params.password)

    const signedUser = authData.user

    if (!signedUser) {
      throw new Error('No se pudo obtener el usuario registrado')
    }

    await createProfile({
      id: signedUser.id,
      username: params.username,
      full_name: params.fullName ?? null,
    })

    await applySession(authData.session)
  }

  async function signOut() {
    await signOutUser()
    setUser(null)
    setProfile(null)
  }

  async function refreshProfile() {
    if (!user) return
    await loadProfile(user.id)
  }

  async function updateMyProfile(params: UpdateMyProfileParams) {
    if (!user) {
      throw new Error('No hay usuario autenticado')
    }

    const updatedProfile = await updateProfile({
      id: user.id,
      username: params.username,
      full_name: params.full_name ?? null,
      bio: params.bio ?? null,
      avatar_url: params.avatar_url ?? null,
    })

    setProfile(updatedProfile)
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const session = await getCurrentSession()

        if (!mounted) return
        await applySession(session)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await applySession(session)
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateMyProfile,
    }),
    [user, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}