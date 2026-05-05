import { supabase } from '../lib/supabase'
import type { Journal, JournalVisibility } from '../types/journal'

interface CreateJournalParams {
  userId: string
  recordedTripId: string
  title: string
  content: string
  visibility: JournalVisibility
}

interface UpdateJournalParams {
  journalId: string
  title: string
  content: string
  visibility: JournalVisibility
}

export async function getJournalByTripId(tripId: string, userId: string) {
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('recorded_trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as Journal | null
}

export async function createJournal(params: CreateJournalParams) {
  const { data, error } = await supabase
    .from('journals')
    .insert({
      user_id: params.userId,
      recorded_trip_id: params.recordedTripId,
      title: params.title,
      content: params.content,
      visibility: params.visibility,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Journal
}

export async function updateJournal(params: UpdateJournalParams) {
  const { data, error } = await supabase
    .from('journals')
    .update({
      title: params.title,
      content: params.content,
      visibility: params.visibility,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.journalId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Journal
}