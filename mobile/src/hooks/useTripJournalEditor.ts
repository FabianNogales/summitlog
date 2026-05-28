import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { getRecordedTripDetailById } from '../services/history.service'
import { createJournal, getJournalByTripId, updateJournal } from '../services/journal.service'
import type { Journal, JournalVisibility } from '../types/journal'
import type { RecordedTrip } from '../types/trip'

function normalizeInput(value: string) {
  return value.trim()
}

export function useTripJournalEditor(tripId?: string) {
  const { user } = useAuth()

  const [trip, setTrip] = useState<RecordedTrip | null>(null)
  const [journal, setJournal] = useState<Journal | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<JournalVisibility>('private')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEditorData = useCallback(async () => {
    if (!tripId || !user) {
      setTrip(null)
      setJournal(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [loadedTrip, loadedJournal] = await Promise.all([
        getRecordedTripDetailById(tripId, user.id),
        getJournalByTripId(tripId, user.id),
      ])

      setTrip(loadedTrip)
      setJournal(loadedJournal)

      if (loadedJournal) {
        setTitle(loadedJournal.title ?? '')
        setContent(loadedJournal.content ?? '')
        setVisibility(loadedJournal.visibility)
      } else {
        setTitle('')
        setContent('')
        setVisibility('private')
      }
    } catch (err: any) {
      setError(err.message ?? 'No se pudo cargar la bitacora')
    } finally {
      setLoading(false)
    }
  }, [tripId, user])

  useEffect(() => {
    loadEditorData()
  }, [loadEditorData])

  const normalizedTitle = useMemo(() => normalizeInput(title), [title])
  const normalizedContent = useMemo(() => normalizeInput(content), [content])
  const normalizedJournalTitle = useMemo(() => normalizeInput(journal?.title ?? ''), [journal?.title])
  const normalizedJournalContent = useMemo(
    () => normalizeInput(journal?.content ?? ''),
    [journal?.content]
  )

  const hasUnsavedChanges = useMemo(() => {
    if (!journal) {
      return Boolean(normalizedTitle || normalizedContent)
    }

    return (
      normalizedTitle !== normalizedJournalTitle ||
      normalizedContent !== normalizedJournalContent ||
      visibility !== journal.visibility
    )
  }, [
    journal,
    normalizedTitle,
    normalizedContent,
    normalizedJournalTitle,
    normalizedJournalContent,
    visibility,
  ])

  async function saveJournal() {
    if (!user) {
      throw new Error('Debes iniciar sesion.')
    }

    if (!tripId) {
      throw new Error('No se encontro el recorrido.')
    }

    if (!trip) {
      throw new Error('No se pudo cargar el recorrido.')
    }

    if (trip.status !== 'completed') {
      throw new Error('Solo puedes crear una bitacora de un recorrido completado.')
    }

    if (!normalizedTitle) {
      throw new Error('El titulo es obligatorio.')
    }

    if (!normalizedContent) {
      throw new Error('El contenido es obligatorio.')
    }

    if (journal && !hasUnsavedChanges) {
      throw new Error('No hay cambios para guardar.')
    }

    try {
      setSaving(true)

      if (journal) {
        const updatedJournal = await updateJournal({
          journalId: journal.id,
          title: normalizedTitle,
          content: normalizedContent,
          visibility,
        })

        setJournal(updatedJournal)
        return updatedJournal
      }

      const createdJournal = await createJournal({
        userId: user.id,
        recordedTripId: tripId,
        title: normalizedTitle,
        content: normalizedContent,
        visibility,
      })

      setJournal(createdJournal)
      return createdJournal
    } finally {
      setSaving(false)
    }
  }

  return {
    trip,
    journal,
    title,
    content,
    visibility,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    setTitle,
    setContent,
    setVisibility,
    saveJournal,
    refreshEditor: loadEditorData,
  }
}
