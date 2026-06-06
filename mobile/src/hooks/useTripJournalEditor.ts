import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getOfflineRecordedTripById,
  getOfflineRecordedTripByRemoteId,
} from '../services/offlineTrip.service'
import {
  createJournal,
  createOfflineJournal,
  getJournalByTripId,
  getOfflineJournalByTripId,
  updateJournal,
  updateOfflineJournal,
  type OfflineJournal,
} from '../services/journal.service'
import { getRecordedTripDetailById } from '../services/history.service'
import type { Journal, JournalDifficulty, JournalVisibility } from '../types/journal'
import type { OfflineRecordedTrip } from '../types/offlineTrip'
import type { RecordedTrip } from '../types/trip'

const FALLBACK_JOURNAL_TITLE = 'Ruta sin título'
const FALLBACK_JOURNAL_CONTENT = 'Sin descripción'

type EditorTrip = OfflineRecordedTrip | RecordedTrip
type EditorJournal = OfflineJournal | Journal
type EditorMode = 'local' | 'remote'

function normalizeInput(value: string) {
  return value.trim()
}

function normalizeDifficulty(value: JournalDifficulty) {
  return value || ''
}

function normalizeCategory(value: string) {
  return value.trim()
}

function normalizeCommentsEnabled(value: unknown) {
  if (typeof value === 'number') return value === 1
  if (typeof value === 'boolean') return value
  return true
}

function isOfflineJournal(journal: EditorJournal | null): journal is OfflineJournal {
  return Boolean(journal && 'local_id' in journal)
}

function getJournalDifficulty(journal: EditorJournal | null) {
  if (!journal || !('difficulty' in journal)) {
    return '' as JournalDifficulty
  }

  return ((journal as any).difficulty ?? '') as JournalDifficulty
}

function getJournalCategory(journal: EditorJournal | null) {
  if (!journal || !('category' in journal)) {
    return ''
  }

  return ((journal as any).category ?? '') as string
}

function getJournalCommentsEnabled(journal: EditorJournal | null) {
  if (!journal || !('comments_enabled' in journal)) {
    return true
  }

  return normalizeCommentsEnabled((journal as any).comments_enabled)
}

export function useTripJournalEditor(tripId?: string) {
  const { user } = useAuth()

  const [mode, setMode] = useState<EditorMode>('local')
  const [trip, setTrip] = useState<EditorTrip | null>(null)
  const [journal, setJournal] = useState<EditorJournal | null>(null)
  const [localTripId, setLocalTripId] = useState<string | null>(null)
  const [remoteTripId, setRemoteTripId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<JournalVisibility>('private')
  const [difficulty, setDifficulty] = useState<JournalDifficulty>('')
  const [category, setCategory] = useState('')
  const [commentsEnabled, setCommentsEnabled] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyJournalToForm(loadedJournal: EditorJournal | null) {
    if (!loadedJournal) {
      setTitle('')
      setContent('')
      setVisibility('private')
      setDifficulty('')
      setCategory('')
      setCommentsEnabled(true)
      return
    }

    setTitle(loadedJournal.title ?? '')
    setContent(loadedJournal.content ?? '')
    setVisibility(loadedJournal.visibility)
    setDifficulty(getJournalDifficulty(loadedJournal))
    setCategory(getJournalCategory(loadedJournal))
    setCommentsEnabled(getJournalCommentsEnabled(loadedJournal))
  }

  const loadEditorData = useCallback(async () => {
    if (!tripId) {
      setTrip(null)
      setJournal(null)
      setLocalTripId(null)
      setRemoteTripId(null)
      applyJournalToForm(null)
      setLoading(false)
      return
    }

    if (!user) {
      setTrip(null)
      setJournal(null)
      setLocalTripId(null)
      setRemoteTripId(null)
      setError('Debes iniciar sesión.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const localById = await getOfflineRecordedTripById(tripId)
      const localByRemoteId = localById ? null : await getOfflineRecordedTripByRemoteId(tripId)
      const localTrip = localById ?? localByRemoteId

      if (localTrip) {
        const loadedJournal = await getOfflineJournalByTripId(localTrip.local_id)

        setMode('local')
        setTrip(localTrip)
        setJournal(loadedJournal)
        setLocalTripId(localTrip.local_id)
        setRemoteTripId(localTrip.remote_id)
        applyJournalToForm(loadedJournal)

        return
      }

      const remoteTrip = await getRecordedTripDetailById(tripId, user.id)
      const remoteJournal = await getJournalByTripId(tripId, user.id)

      setMode('remote')
      setTrip(remoteTrip)
      setJournal(remoteJournal)
      setLocalTripId(null)
      setRemoteTripId(remoteTrip.id)

      if (remoteJournal) {
        applyJournalToForm(remoteJournal)
      } else {
        setTitle(remoteTrip.title ?? '')
        setContent(remoteTrip.summary ?? '')
        setVisibility(remoteTrip.is_private ? 'private' : 'public')
        setDifficulty('')
        setCategory('')
        setCommentsEnabled(true)
      }
    } catch (err: any) {
      setError(err.message ?? 'No se pudo cargar la bitácora.')
    } finally {
      setLoading(false)
    }
  }, [tripId, user])

  useEffect(() => {
    loadEditorData()
  }, [loadEditorData])

  const normalizedTitle = useMemo(() => normalizeInput(title), [title])
  const normalizedContent = useMemo(() => normalizeInput(content), [content])
  const normalizedDifficulty = useMemo(() => normalizeDifficulty(difficulty), [difficulty])
  const normalizedCategory = useMemo(() => normalizeCategory(category), [category])

  const normalizedJournalTitle = useMemo(
    () => normalizeInput(journal?.title ?? ''),
    [journal?.title]
  )

  const normalizedJournalContent = useMemo(
    () => normalizeInput(journal?.content ?? ''),
    [journal?.content]
  )

  const normalizedJournalDifficulty = useMemo(
    () => normalizeDifficulty(getJournalDifficulty(journal)),
    [journal]
  )

  const normalizedJournalCategory = useMemo(
    () => normalizeCategory(getJournalCategory(journal)),
    [journal]
  )

  const journalCommentsEnabled = useMemo(
    () => getJournalCommentsEnabled(journal),
    [journal]
  )

  const hasUnsavedChanges = useMemo(() => {
    if (!journal) {
      return Boolean(
        normalizedTitle ||
          normalizedContent ||
          normalizedDifficulty ||
          normalizedCategory ||
          commentsEnabled !== true ||
          visibility !== 'private'
      )
    }

    return (
      normalizedTitle !== normalizedJournalTitle ||
      normalizedContent !== normalizedJournalContent ||
      visibility !== journal.visibility ||
      normalizedDifficulty !== normalizedJournalDifficulty ||
      normalizedCategory !== normalizedJournalCategory ||
      commentsEnabled !== journalCommentsEnabled
    )
  }, [
    journal,
    normalizedTitle,
    normalizedContent,
    normalizedDifficulty,
    normalizedCategory,
    normalizedJournalTitle,
    normalizedJournalContent,
    normalizedJournalDifficulty,
    normalizedJournalCategory,
    visibility,
    commentsEnabled,
    journalCommentsEnabled,
  ])

  async function saveJournal(options?: { allowNoFormChanges?: boolean }) {
    if (saving) {
      throw new Error('La bitácora ya se está guardando.')
    }

    if (!user) {
      throw new Error('Debes iniciar sesión.')
    }

    if (!trip) {
      throw new Error('No se pudo cargar el recorrido.')
    }

    if (trip.status !== 'completed') {
      throw new Error('Solo puedes crear una bitácora de un recorrido completado.')
    }

    if (journal && !hasUnsavedChanges && options?.allowNoFormChanges) {
      return journal
    }

    if (journal && !hasUnsavedChanges) {
      throw new Error('No hay cambios para guardar.')
    }

    const finalTitle = normalizedTitle || FALLBACK_JOURNAL_TITLE
    const finalContent = normalizedContent || FALLBACK_JOURNAL_CONTENT

    try {
      setSaving(true)

      if (mode === 'local') {
        if (!localTripId) {
          throw new Error('No se encontró el recorrido local.')
        }

        if (isOfflineJournal(journal)) {
          const updatedJournal = await updateOfflineJournal({
            journalId: journal.local_id,
            title: finalTitle,
            content: finalContent,
            visibility,
            difficulty: normalizedDifficulty as JournalDifficulty,
            category: normalizedCategory,
            commentsEnabled,
          })

          if (journal.remote_id) {
            try {
              await updateJournal({
                journalId: journal.remote_id,
                title: finalTitle,
                content: finalContent,
                visibility,
                difficulty: normalizedDifficulty as JournalDifficulty,
                category: normalizedCategory,
                commentsEnabled,
              })
            } catch (_e) {
              // el sync offline empuja el cambio pendiente si esto falla
            }
          }

          setJournal(updatedJournal)
          applyJournalToForm(updatedJournal)
          return updatedJournal
        }

        const createdJournal = await createOfflineJournal({
          userId: user.id,
          recordedTripId: localTripId,
          title: finalTitle,
          content: finalContent,
          visibility,
          difficulty: normalizedDifficulty as JournalDifficulty,
          category: normalizedCategory,
          commentsEnabled,
        })

        setJournal(createdJournal)
        applyJournalToForm(createdJournal)
        return createdJournal
      }

      if (!remoteTripId) {
        throw new Error('No se encontró el recorrido remoto.')
      }

      if (journal && !isOfflineJournal(journal)) {
        const updatedJournal = await updateJournal({
          journalId: journal.id,
          title: finalTitle,
          content: finalContent,
          visibility,
          difficulty: normalizedDifficulty as JournalDifficulty,
          category: normalizedCategory,
          commentsEnabled,
        })

        setJournal(updatedJournal)
        applyJournalToForm(updatedJournal)
        return updatedJournal
      }

      const createdJournal = await createJournal({
        userId: user.id,
        recordedTripId: remoteTripId,
        title: finalTitle,
        content: finalContent,
        visibility,
        difficulty: normalizedDifficulty as JournalDifficulty,
        category: normalizedCategory,
        commentsEnabled,
      })

      setJournal(createdJournal)
      applyJournalToForm(createdJournal)
      return createdJournal
    } finally {
      setSaving(false)
    }
  }

  return {
    mode,
    trip,
    journal,
    title,
    content,
    visibility,
    difficulty,
    category,
    commentsEnabled,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    setTitle,
    setContent,
    setVisibility,
    setDifficulty,
    setCategory,
    setCommentsEnabled,
    saveJournal,
    refreshEditor: loadEditorData,
  }
}
