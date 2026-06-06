import type { SocialPostAuthor } from '../types/post'

const UNKNOWN_USER_LABEL = 'Usuario'

function normalizeUsername(username?: string | null) {
  const normalized = username?.trim() ?? ''
  return normalized.length > 0 ? normalized : null
}

export function formatUsername(username?: string | null) {
  const normalized = normalizeUsername(username)
  return normalized ? `@${normalized}` : null
}

interface GetAuthorDisplayNameOptions {
  fallbackUsername?: string | null
}

export function getAuthorDisplayName(
  author?: SocialPostAuthor | null,
  options: GetAuthorDisplayNameOptions = {}
) {
  const authorUsername = formatUsername(author?.username)
  if (authorUsername) return authorUsername

  const fallbackUsername = formatUsername(options.fallbackUsername)
  if (fallbackUsername) return fallbackUsername

  const fullName = author?.full_name?.trim()
  if (fullName) return fullName

  return UNKNOWN_USER_LABEL
}
