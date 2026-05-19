import type { Session } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'

import { supabase } from '../lib/supabase'

const GOOGLE_REDIRECT_TO = 'mobile://auth/callback'

interface CompleteOAuthOptions {
  allowNoCredentials?: boolean
}

interface CompleteOAuthResult {
  session: Session | null
  error: Error | null
  hasCredentials: boolean
}

interface OAuthParams {
  code?: string
  access_token?: string
  refresh_token?: string
  error?: string
  error_code?: string
  error_description?: string
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return data.user
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export function sanitizeOAuthUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) {
    return null
  }

  return rawUrl
    .replace(
      /(access_token|refresh_token|provider_token|id_token|code)=([^&#]+)/gi,
      '$1=***'
    )
}

function parseParams(input: string | undefined) {
  if (!input) return {}

  const params = new URLSearchParams(input.replace(/^\?/, '').replace(/^#/, ''))
  const parsed: Record<string, string> = {}

  params.forEach((value, key) => {
    parsed[key] = value
  })

  return parsed
}

function pickOAuthParams(values: Record<string, string>) {
  return {
    code: values.code,
    access_token: values.access_token,
    refresh_token: values.refresh_token,
    error: values.error,
    error_code: values.error_code,
    error_description: values.error_description,
  } satisfies OAuthParams
}

function parseOAuthParamsFromUrl(rawUrl: string) {
  const hashIndex = rawUrl.indexOf('#')
  const queryIndex = rawUrl.indexOf('?')

  const queryPart =
    queryIndex >= 0
      ? rawUrl.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
      : undefined
  const hashPart = hashIndex >= 0 ? rawUrl.slice(hashIndex + 1) : undefined

  return {
    ...pickOAuthParams(parseParams(queryPart)),
    ...pickOAuthParams(parseParams(hashPart)),
  }
}

export async function completeOAuthFromUrl(
  rawUrl: string,
  options?: CompleteOAuthOptions
): Promise<CompleteOAuthResult> {
  console.log(
    '[GoogleAuth] completeOAuthFromUrl called with:',
    sanitizeOAuthUrl(rawUrl) ?? 'null'
  )
  const parsed = parseOAuthParamsFromUrl(rawUrl)
  const hasCode = Boolean(parsed.code)
  const hasTokenPair = Boolean(parsed.access_token && parsed.refresh_token)

  console.log('[GoogleAuth] parsed params:', {
    hasCode,
    hasTokenPair,
    hasError: Boolean(parsed.error || parsed.error_code || parsed.error_description),
  })

  const callbackError =
    parsed.error_description ?? parsed.error ?? parsed.error_code

  if (callbackError) {
    console.log('[GoogleAuth] callback error found:', callbackError)
    return {
      session: null,
      error: new Error(callbackError),
      hasCredentials: false,
    }
  }

  if (hasCode) {
    console.log('[GoogleAuth] calling exchangeCodeForSession')
    const { session, error } = await exchangeCodeForSession(parsed.code as string)

    if (error) {
      console.log('[GoogleAuth] exchangeCodeForSession error:', error.message)
      return { session: null, error, hasCredentials: true }
    }

    const finalSession = session ?? (await getCurrentSession())
    console.log('[GoogleAuth] exchangeCodeForSession success, hasSession:', Boolean(finalSession))

    return {
      session: finalSession,
      error: finalSession ? null : new Error('No se pudo confirmar la sesion'),
      hasCredentials: true,
    }
  }

  if (hasTokenPair) {
    console.log('[GoogleAuth] tokens detected from hash/query')
    console.log('[GoogleAuth] calling setSession')
    const { data, error } = await supabase.auth.setSession({
      access_token: parsed.access_token as string,
      refresh_token: parsed.refresh_token as string,
    })

    if (error) {
      console.log('[GoogleAuth] setSession error:', error.message)
      return { session: null, error, hasCredentials: true }
    }

    const finalSession = data.session ?? (await getCurrentSession())
    console.log('[GoogleAuth] setSession success, hasSession:', Boolean(finalSession))

    return {
      session: finalSession,
      error: finalSession ? null : new Error('No se pudo confirmar la sesion'),
      hasCredentials: true,
    }
  }

  if (options?.allowNoCredentials) {
    return { session: null, error: null, hasCredentials: false }
  }

  return {
    session: null,
    error: new Error('No se completó el inicio de sesión con Google'),
    hasCredentials: false,
  }
}

export async function signInWithGoogle() {
  console.log('[GoogleAuth] signInWithGoogle started')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: GOOGLE_REDIRECT_TO,
      skipBrowserRedirect: true,
    },
  })

  if (error) {
    throw error
  }

  console.log('OAuth provider url exists:', Boolean(data?.url))

  if (!data?.url) {
    throw new Error('No se pudo iniciar OAuth con Google')
  }

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    GOOGLE_REDIRECT_TO
  )

  const resultUrl = 'url' in result ? result.url ?? null : null

  console.log('openAuthSessionAsync result type:', result.type)
  console.log(
    'openAuthSessionAsync result url sanitized:',
    sanitizeOAuthUrl(resultUrl) ?? 'null'
  )
  console.log('[GoogleAuth] result url received:', Boolean(resultUrl))

  if (result.type === 'cancel' || result.type === 'dismiss') {
    const cancelError = new Error('Inicio de sesión con Google cancelado') as Error & {
      code?: string
    }
    cancelError.code = 'oauth_cancelled'
    throw cancelError
  }

  if (result.type !== 'success') {
    throw new Error('No se completó el inicio de sesión con Google')
  }

  if (resultUrl) {
    const completed = await completeOAuthFromUrl(resultUrl)

    if (completed.error) {
      throw completed.error
    }

    if (completed.session) {
      console.log('[GoogleAuth] signInWithGoogle finished with session from result URL')
      return completed.session
    }
  }

  console.log('[GoogleAuth] result URL had no immediate session, checking current session')
  const session = await getCurrentSession()
  console.log('[GoogleAuth] getSession after OAuth hasSession:', Boolean(session))

  if (!session) {
    throw new Error('No se completó el inicio de sesión con Google')
  }

  console.log('[GoogleAuth] signInWithGoogle finished')
  return session
}

export async function exchangeCodeForSession(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  return {
    session: data?.session ?? null,
    error,
  }
}
