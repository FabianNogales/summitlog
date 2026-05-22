import type { RefObject } from 'react'
import { findNodeHandle } from 'react-native'
import type { ScrollView } from 'react-native'

export const KEYBOARD_SCROLL_DELAY_MS = 320
// Aumenta este valor para que el input quede mas arriba del teclado.
// Reduce este valor para que el input quede mas cerca del teclado.
export const DEFAULT_INPUT_SCROLL_OFFSET = 60
// Offset sugerido para modales con contenido largo.
export const MODAL_INPUT_SCROLL_OFFSET = 90
export const FORM_SCROLL_BOTTOM_PADDING = 100
export const MODAL_SCROLL_BOTTOM_PADDING = 120

type KeyboardScrollResponder = {
  scrollResponderScrollNativeHandleToKeyboard?: (
    nodeHandle: number,
    additionalOffset?: number,
    preventNegativeScrollOffset?: boolean
  ) => void
}

function resolveTargetNodeHandle(target: unknown): number | null {
  if (typeof target === 'number') {
    return target
  }

  if (target && typeof target === 'object') {
    return findNodeHandle(target as never)
  }

  return null
}

export function scrollToFocusedInput(
  scrollRef: RefObject<ScrollView | null>,
  event: { target?: unknown } | undefined,
  extraOffset = DEFAULT_INPUT_SCROLL_OFFSET
) {
  const scrollView = scrollRef.current
  if (!scrollView) {
    return
  }

  const targetNodeHandle = resolveTargetNodeHandle(event?.target)
  if (!targetNodeHandle) {
    return
  }

  const scrollResponder =
    ((scrollView as unknown as { getScrollResponder?: () => unknown }).getScrollResponder?.() as
      | KeyboardScrollResponder
      | undefined) ??
    (scrollView as unknown as KeyboardScrollResponder)

  if (typeof scrollResponder.scrollResponderScrollNativeHandleToKeyboard !== 'function') {
    return
  }
  const scrollToKeyboard = scrollResponder.scrollResponderScrollNativeHandleToKeyboard

  setTimeout(() => {
    scrollToKeyboard(
      targetNodeHandle,
      extraOffset,
      true
    )
  }, KEYBOARD_SCROLL_DELAY_MS)
}
