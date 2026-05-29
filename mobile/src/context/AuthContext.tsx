import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import {
  getCurrentSession,
  signInWithEmail,
  signInWithGoogle as signInWithGoogleService,
  signOutUser,
  signUpWithEmail,
} from '../services/auth.service'
import {
  createProfile,
  ensureProfileForUser,
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
  username?: string
  full_name?: string | null
  bio?: string | null
  avatar_url?: string | null
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  profileLoadError: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<Session | null>
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
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (sessionUser: User) => {
    console.log('[AuthContext] ensureProfile start:', sessionUser.id)
    try {
      const currentProfile = await ensureProfileForUser(sessionUser)
      setProfile(currentProfile)
      setProfileLoadError(null)
      console.log('[AuthContext] ensureProfile success:', sessionUser.id)
      console.log('[AuthContext] profile exists:', Boolean(currentProfile?.id))
    } catch (error: any) {
      setProfile(null)
      setProfileLoadError(
        'No se pudo cargar tu perfil. Intenta cerrar sesion e iniciar nuevamente.'
      )
      console.log(
        '[AuthContext] ensureProfile error:',
        error?.message ?? 'unknown'
      )
      console.log('[AuthContext] profile exists: false')
    }
  }, [])

  const applySession = useCallback(
    async (session: Session | null) => {
      console.log('[AuthContext] applySession start')
      const sessionUser = session?.user ?? null

      try {
        setUser(sessionUser)
        console.log(
          '[AuthContext] applySession set user/session:',
          Boolean(sessionUser)
        )
        const provider =
          ((sessionUser?.app_metadata ?? {}) as Record<string, unknown>).provider ??
          null
        const identitiesCount = Array.isArray(
          (sessionUser as unknown as { identities?: unknown[] })?.identities
        )
          ? ((sessionUser as unknown as { identities?: unknown[] }).identities
              ?.length ?? 0)
          : 0
        console.log('[AuthContext] session diagnostics:', {
          provider,
          emailExists: Boolean(sessionUser?.email),
          userId: sessionUser?.id ?? null,
          identitiesCount,
        })

        if (!sessionUser) {
          setProfile(null)
          setProfileLoadError(null)
          return
        }

        await loadProfile(sessionUser)
      } finally {
        console.log('[AuthContext] applySession finally')
        setLoading(false)
        console.log('[AuthContext] loading false')
      }
    },
    [loadProfile]
  )

  async function signIn(email: string, password: string) {
    const authData = await signInWithEmail(email, password)
    await applySession(authData.session)
  }

  async function signInWithGoogle() {
    const session = await signInWithGoogleService()
    console.log('[AuthContext] signInWithGoogle resolved hasSession:', Boolean(session))
    const sessionUser = session?.user ?? null
    const provider =
      ((sessionUser?.app_metadata ?? {}) as Record<string, unknown>).provider ??
      null
    const identitiesCount = Array.isArray(
      (sessionUser as unknown as { identities?: unknown[] })?.identities
    )
      ? ((sessionUser as unknown as { identities?: unknown[] }).identities
          ?.length ?? 0)
      : 0
    console.log('[AuthContext] google sign-in diagnostics:', {
      provider,
      emailExists: Boolean(sessionUser?.email),
      userId: sessionUser?.id ?? null,
      identitiesCount,
    })
    return session
  }

  async function signUp(params: RegisterParams) {
    const authData = await signUpWithEmail(params.email, params.password)

    const signedUser = authData.user

    if (!signedUser) {
      throw new Error('No se pudo obtener el usuario registrado')
    }

    try {
      await createProfile({
        id: signedUser.id,
        username: params.username,
        full_name: params.fullName ?? null,
      })
    } catch {
      await signOutUser().catch(() => null)
      setUser(null)
      setProfile(null)
      setProfileLoadError(
        'La cuenta se creo, pero no se pudo completar el perfil.'
      )
      throw new Error(
        'La cuenta se creo, pero no se pudo completar el perfil. Cerramos la sesion para evitar un estado incompleto. Intenta iniciar sesion nuevamente.'
      )
    }

    await applySession(authData.session)
  }

  async function signOut() {
    await signOutUser()
    setUser(null)
    setProfile(null)
  }

  async function refreshProfile() {
    if (!user) return
    await loadProfile(user)
  }

  async function updateMyProfile(params: UpdateMyProfileParams) {
    if (!user) {
      throw new Error('No hay usuario autenticado')
    }

    const updatedProfile = await updateProfile({
      id: user.id,
      username: params.username,
      full_name: params.full_name,
      bio: params.bio,
      avatar_url: params.avatar_url,
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
      } catch (error: any) {
        console.log('[AuthContext] bootstrap error:', error?.message ?? 'unknown')
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('[AuthContext] loading false (bootstrap)')
        }
      }
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] auth state event:', event)
      console.log('[AuthContext] session user id exists:', Boolean(session?.user?.id))

      setTimeout(() => {
        if (!mounted) return

        applySession(session).catch((error: any) => {
          console.log(
            '[AuthContext] applySession async error:',
            error?.message ?? 'unknown'
          )
        })
      }, 0)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [applySession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      profileLoadError,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshProfile,
      updateMyProfile,
    }),
    [user, profile, profileLoadError, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
