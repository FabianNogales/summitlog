export function normalizeText(value?: string | null) {
  const normalized = value?.trim() ?? ''
  return normalized || null
}