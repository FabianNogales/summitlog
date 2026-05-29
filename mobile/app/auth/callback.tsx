import { useEffect, useRef } from 'react'
import { Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { completeOAuthFromUrl } from '../../src/services/auth.service'

type MaybeParam = string | string[] | undefined

function firstValue(value: MaybeParam) {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0) return value[0]
  return undefined
}

function extractErrorFromRouteParams(params: Record<string, MaybeParam>) {
  return (
    firstValue(params.error_description) ??
    firstValue(params.error) ??
    firstValue(params.error_code) ??
    null
  )
}

function hasRouteCredentials(params: Record<string, MaybeParam>) {
  return Boolean(
    firstValue(params.code) ||
      (firstValue(params.access_token) && firstValue(params.refresh_token))
  )
}

export default function AuthCallbackScreen() {
  const router = useRouter()
  const routeParams = useLocalSearchParams<{
    code?: MaybeParam
    access_token?: MaybeParam
    refresh_token?: MaybeParam
    error?: MaybeParam
    error_code?: MaybeParam
    error_description?: MaybeParam
  }>()
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    if (hasProcessedRef.current) {
      return
    }

    let isActive = true

    async function processAuthCallback() {
      const routeError = extractErrorFromRouteParams(routeParams)
      const hasCredentials = hasRouteCredentials(routeParams)

      try {
        if (routeError) {
          throw new Error(routeError)
        }

        if (hasCredentials) {
          const qs = new URLSearchParams()
          const code = firstValue(routeParams.code)
          const accessToken = firstValue(routeParams.access_token)
          const refreshToken = firstValue(routeParams.refresh_token)

          if (code) qs.set('code', code)
          if (accessToken) qs.set('access_token', accessToken)
          if (refreshToken) qs.set('refresh_token', refreshToken)

          const completion = await completeOAuthFromUrl(
            `summitlog://auth/callback?${qs.toString()}`
          )

          if (completion.error) {
            throw completion.error
          }
        }

        // Callback vacío: no decide fallo; deja que el flujo principal termine.
        if (!hasCredentials) {
          console.log('[Callback] no credentials in callback, deferring to auth flow')
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }

        if (isActive) {
          hasProcessedRef.current = true
          router.replace('/(tabs)/home')
        }
      } catch (error: any) {
        const message =
          typeof error?.message === 'string' && error.message.trim().length > 0
            ? error.message
            : 'No se completó el inicio de sesión'
        console.log('[Callback] error, redirecting login:', message)

        if (isActive) {
          hasProcessedRef.current = true
          router.replace({
            pathname: '/(auth)/login',
            params: { authError: message },
          })
        }
      }
    }

    processAuthCallback()

    return () => {
      isActive = false
    }
  }, [routeParams, router])

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Text>Procesando inicio de sesion...</Text>
      </View>
    </SafeAreaView>
  )
}
