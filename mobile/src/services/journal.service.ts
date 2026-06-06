import { supabase } from '../lib/supabase'
import { getOfflineDb } from './offlineDb.service'
import {
  getJournalMediaByJournalId,
  getJournalMediaPublicUrl,
  uploadJournalImage,
} from './journalMedia.service'
import {
  publishRecordedTripAsRoute,
  unpublishRecordedTripRoute,
} from './routePublish.service'
import type {
  Journal,
  JournalDifficulty,
  JournalMedia,
  JournalVisibility,
} from '../types/journal'
import * as FileSystem from 'expo-file-system/legacy'

interface CreateJournalParams {
  userId: string
  recordedTripId: string
  title: string
  content: string
  visibility: JournalVisibility
  difficulty?: JournalDifficulty | null
  category?: string | null
  commentsEnabled?: boolean
  skipRoutePublication?: boolean
}

interface UpdateJournalParams {
  journalId: string
  title: string
  content: string
  visibility: JournalVisibility
  difficulty?: JournalDifficulty | null
  category?: string | null
  commentsEnabled?: boolean
  skipRoutePublication?: boolean
}

export interface OfflineJournal {
  local_id: string
  remote_id: string | null
  local_trip_id: string
  user_id: string
  title: string
  content: string
  visibility: JournalVisibility
  difficulty: JournalDifficulty | null
  category: string | null
  comments_enabled: number
  sync_status: string
  created_at: string
  updated_at: string
}

export interface JournalSyncResult {
  total: number
  synced: number
  alreadySynced: number
  failed: number
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeDifficulty(value?: JournalDifficulty | null) {
  return value ? value : null
}

function normalizeCategory(value?: string | null) {
  const normalized = value?.trim() ?? ''
  return normalized || null
}

function booleanFromSqlite(value: number | boolean | null | undefined) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  return true
}

async function syncRoutePublicationForTrip(
  recordedTripId: string,
  params: {
    title: string
    content: string
    visibility: JournalVisibility
    difficulty?: JournalDifficulty | null
    category?: string | null
    commentsEnabled?: boolean
  }
) {
  if (params.visibility === 'public') {
    await publishRecordedTripAsRoute({
      recordedTripId,
      title: params.title,
      description: params.content,
      difficulty: params.difficulty ?? null,
      category: params.category ?? null,
      commentsEnabled: params.commentsEnabled ?? true,
    })

    return
  }

  await unpublishRecordedTripRoute(recordedTripId)
}

function isDuplicateJournalMediaSortOrderError(error: unknown) {
  const maybeError = error as { code?: string; message?: string } | null
  const message = maybeError?.message?.toLowerCase() ?? ''

  return (
    maybeError?.code === '23505' &&
    message.includes('journal_media_journal_id_sort_order_key')
  )
}

function getJournalMediaExtension(fileName?: string | null, mimeType?: string | null) {
  const fileNameExtension = fileName?.split('.').pop()?.toLowerCase()

  if (fileNameExtension === 'png') {
    return 'png'
  }

  if (fileNameExtension === 'jpg' || fileNameExtension === 'jpeg') {
    return fileNameExtension
  }

  return mimeType?.toLowerCase().includes('png') ? 'png' : 'jpg'
}

function buildSyncedJournalMediaStoragePath(params: {
  userId: string
  journalId: string
  localMediaId: string
  fileName?: string | null
  mimeType?: string | null
}) {
  const extension = getJournalMediaExtension(params.fileName, params.mimeType)
  return `${params.userId}/${params.journalId}/${params.localMediaId}.${extension}`
}

async function getNextRemoteJournalMediaSortOrder(journalId: string) {
  const remoteMedia = await getJournalMediaByJournalId(journalId)
  const maxSortOrder = remoteMedia.reduce((maxValue, media) => {
    const sortOrder = Number(media.sort_order)
    return Number.isFinite(sortOrder) ? Math.max(maxValue, sortOrder) : maxValue
  }, -1)

  return maxSortOrder + 1
}

async function getRemoteJournalMediaById(mediaId: string, journalId: string) {
  const { data, error } = await supabase
    .from('journal_media')
    .select('*')
    .eq('id', mediaId)
    .eq('journal_id', journalId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as JournalMedia | null
}

async function getRemoteJournalMediaByFilePath(filePath: string, journalId: string) {
  const { data, error } = await supabase
    .from('journal_media')
    .select('*')
    .eq('journal_id', journalId)
    .eq('file_path', filePath)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data ?? null) as JournalMedia | null
}

async function syncRoutePublicationForTripWithoutBlockingJournalSync(
  recordedTripId: string,
  params: {
    title: string
    content: string
    visibility: JournalVisibility
    difficulty?: JournalDifficulty | null
    category?: string | null
    commentsEnabled?: boolean
  }
) {
  try {
    await syncRoutePublicationForTrip(recordedTripId, params)
  } catch (error: any) {
    console.warn(
      '[JournalSync] La bitacora se sincronizo, pero no se publico como ruta.',
      error?.message ?? error
    )
  }
}

export async function getOfflineJournalByLocalId(localJournalId: string) {
  const db = await getOfflineDb()

  const row = await db.getFirstAsync<OfflineJournal>(
    `
      SELECT *
      FROM offline_journals
      WHERE local_id = ?
    `,
    [localJournalId]
  )

  return row ?? null
}

export async function getOfflineJournalByTripId(tripId: string) {
  const db = await getOfflineDb()

  const row = await db.getFirstAsync<OfflineJournal>(
    `
      SELECT *
      FROM offline_journals
      WHERE local_trip_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [tripId]
  )

  return row ?? null
}

export async function createOfflineJournal(params: CreateJournalParams & { localId?: string }) {
  const db = await getOfflineDb()
  const now = new Date().toISOString()
  const localId = params.localId ?? createLocalId('journal')

  await db.runAsync(
    `
      INSERT INTO offline_journals (
        local_id,
        remote_id,
        local_trip_id,
        user_id,
        title,
        content,
        visibility,
        difficulty,
        category,
        comments_enabled,
        sync_status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localId,
      null,
      params.recordedTripId,
      params.userId,
      params.title,
      params.content,
      params.visibility,
      normalizeDifficulty(params.difficulty),
      normalizeCategory(params.category),
      params.commentsEnabled === false ? 0 : 1,
      'pending',
      now,
      now,
    ]
  )

  const createdJournal = await getOfflineJournalByLocalId(localId)

  if (!createdJournal) {
    throw new Error('No se pudo crear la bitácora local.')
  }

  return createdJournal
}

export async function updateOfflineJournal(params: UpdateJournalParams) {
  const db = await getOfflineDb()
  const now = new Date().toISOString()

  await db.runAsync(
    `
      UPDATE offline_journals
      SET
        title = ?,
        content = ?,
        visibility = ?,
        difficulty = ?,
        category = ?,
        comments_enabled = ?,
        sync_status = ?,
        updated_at = ?
      WHERE local_id = ?
    `,
    [
      params.title,
      params.content,
      params.visibility,
      normalizeDifficulty(params.difficulty),
      normalizeCategory(params.category),
      params.commentsEnabled === false ? 0 : 1,
      'pending',
      now,
      params.journalId,
    ]
  )

  const updatedJournal = await getOfflineJournalByLocalId(params.journalId)

  if (!updatedJournal) {
    throw new Error('No se pudo actualizar la bitácora local.')
  }

  return updatedJournal
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

  const journal = data as Journal

  if (!params.skipRoutePublication) {
    await syncRoutePublicationForTrip(params.recordedTripId, {
      title: params.title,
      content: params.content,
      visibility: params.visibility,
      difficulty: params.difficulty,
      category: params.category,
      commentsEnabled: params.commentsEnabled,
    })
  }

  return journal
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

  const journal = data as Journal

  if (!params.skipRoutePublication) {
    await syncRoutePublicationForTrip(journal.recorded_trip_id, {
      title: params.title,
      content: params.content,
      visibility: params.visibility,
      difficulty: params.difficulty,
      category: params.category,
      commentsEnabled: params.commentsEnabled,
    })
  }

  return journal
}

export async function syncPendingJournalsAndMediaForUser(
  userId: string
): Promise<JournalSyncResult> {
  const db = await getOfflineDb()

  const pendingJournals = await db.getAllAsync<OfflineJournal>(
    `
      SELECT DISTINCT j.*
      FROM offline_journals j
      INNER JOIN offline_recorded_trips t ON j.local_trip_id = t.local_id
      LEFT JOIN offline_journal_media m ON m.local_journal_id = j.local_id
      WHERE j.user_id = ?
      AND t.status = 'completed'
      AND t.remote_id IS NOT NULL
      AND (
        j.sync_status IN ('pending', 'failed', 'syncing')
        OR m.sync_status IN ('pending', 'failed', 'syncing')
      )
      ORDER BY j.created_at ASC
    `,
    [userId]
  )

  let synced = 0
  let alreadySynced = 0
  let failed = 0

  for (const journal of pendingJournals) {
    try {
      await db.runAsync(
        `
          UPDATE offline_journals
          SET sync_status = ?, updated_at = ?
          WHERE local_id = ?
        `,
        ['syncing', new Date().toISOString(), journal.local_id]
      )

      const tripRow = await db.getFirstAsync<{ remote_id: string | null }>(
        `
          SELECT remote_id
          FROM offline_recorded_trips
          WHERE local_id = ?
          AND status = 'completed'
        `,
        [journal.local_trip_id]
      )

      if (!tripRow?.remote_id) {
        throw new Error('El recorrido todavía no tiene ID remoto.')
      }

      let remoteJournalId = journal.remote_id

      if (!remoteJournalId) {
        const existingRemoteJournal = await getJournalByTripId(tripRow.remote_id, userId)

        if (existingRemoteJournal?.id) {
          remoteJournalId = existingRemoteJournal.id
        } else {
          const remoteJournal = await createJournal({
            userId,
            recordedTripId: tripRow.remote_id,
            title: journal.title,
            content: journal.content,
            visibility: journal.visibility,
            difficulty: journal.difficulty,
            category: journal.category,
            commentsEnabled: booleanFromSqlite(journal.comments_enabled),
            skipRoutePublication: true,
          })

          remoteJournalId = remoteJournal.id
        }

        await db.runAsync(
          `
            UPDATE offline_journals
            SET remote_id = ?, updated_at = ?
            WHERE local_id = ?
          `,
          [remoteJournalId, new Date().toISOString(), journal.local_id]
        )
      } else if (journal.sync_status !== 'synced') {
        await updateJournal({
          journalId: remoteJournalId,
          title: journal.title,
          content: journal.content,
          visibility: journal.visibility,
          difficulty: journal.difficulty,
          category: journal.category,
          commentsEnabled: booleanFromSqlite(journal.comments_enabled),
          skipRoutePublication: true,
        })
      }

      await syncRoutePublicationForTripWithoutBlockingJournalSync(tripRow.remote_id, {
        title: journal.title,
        content: journal.content,
        visibility: journal.visibility,
        difficulty: journal.difficulty,
        category: journal.category,
        commentsEnabled: booleanFromSqlite(journal.comments_enabled),
      })

      const localMedia = await db.getAllAsync<{
        local_id: string
        remote_id: string | null
        local_path: string
        file_name: string | null
        mime_type: string | null
        sort_order: number
      }>(
        `
          SELECT local_id, remote_id, local_path, file_name, mime_type, sort_order
          FROM offline_journal_media
          WHERE local_journal_id = ?
          AND sync_status IN ('pending', 'failed', 'syncing')
          ORDER BY sort_order ASC
        `,
        [journal.local_id]
      )

      let mediaFailed = 0
      let nextRemoteSortOrder = await getNextRemoteJournalMediaSortOrder(remoteJournalId)

      for (const media of localMedia) {
        try {
          await db.runAsync(
            `
              UPDATE offline_journal_media
              SET sync_status = ?, updated_at = ?
              WHERE local_id = ?
            `,
            ['syncing', new Date().toISOString(), media.local_id]
          )

          if (media.remote_id) {
            const existingRemoteMedia = await getRemoteJournalMediaById(
              media.remote_id,
              remoteJournalId
            )

            if (existingRemoteMedia) {
              await db.runAsync(
                `
                  UPDATE offline_journal_media
                  SET
                    remote_url = ?,
                    sync_status = ?,
                    updated_at = ?
                  WHERE local_id = ?
                `,
                [
                  getJournalMediaPublicUrl(existingRemoteMedia.file_path),
                  'synced',
                  new Date().toISOString(),
                  media.local_id,
                ]
              )
              const existingSortOrder = Number(existingRemoteMedia.sort_order)
              if (Number.isFinite(existingSortOrder)) {
                nextRemoteSortOrder = Math.max(nextRemoteSortOrder, existingSortOrder + 1)
              }
              continue
            }
          }

          const stableStoragePath = buildSyncedJournalMediaStoragePath({
            userId,
            journalId: remoteJournalId,
            localMediaId: media.local_id,
            fileName: media.file_name,
            mimeType: media.mime_type,
          })
          const existingRemoteMediaByPath = await getRemoteJournalMediaByFilePath(
            stableStoragePath,
            remoteJournalId
          )

          if (existingRemoteMediaByPath) {
            await db.runAsync(
              `
                UPDATE offline_journal_media
                SET
                  remote_id = ?,
                  remote_url = ?,
                  sync_status = ?,
                  updated_at = ?
                WHERE local_id = ?
              `,
              [
                existingRemoteMediaByPath.id,
                getJournalMediaPublicUrl(existingRemoteMediaByPath.file_path),
                'synced',
                new Date().toISOString(),
                media.local_id,
              ]
            )
            const existingSortOrder = Number(existingRemoteMediaByPath.sort_order)
            if (Number.isFinite(existingSortOrder)) {
              nextRemoteSortOrder = Math.max(nextRemoteSortOrder, existingSortOrder + 1)
            }
            continue
          }

          const fileInfo = await FileSystem.getInfoAsync(media.local_path)

          if (!fileInfo.exists) {
            await db.runAsync(
              `
                DELETE FROM offline_journal_media
                WHERE local_id = ?
              `,
              [media.local_id]
            )
            continue
          }

          let uploadedMedia: JournalMedia

          try {
            uploadedMedia = await uploadJournalImage({
              journalId: remoteJournalId,
              userId,
              fileUri: media.local_path,
              fileName: media.file_name,
              mimeType: media.mime_type,
              sortOrder: nextRemoteSortOrder,
              storagePath: stableStoragePath,
            })
          } catch (uploadError) {
            if (!isDuplicateJournalMediaSortOrderError(uploadError)) {
              throw uploadError
            }

            nextRemoteSortOrder = await getNextRemoteJournalMediaSortOrder(remoteJournalId)
            uploadedMedia = await uploadJournalImage({
              journalId: remoteJournalId,
              userId,
              fileUri: media.local_path,
              fileName: media.file_name,
              mimeType: media.mime_type,
              sortOrder: nextRemoteSortOrder,
              storagePath: stableStoragePath,
            })
          }

          const uploadedSortOrder = Number(uploadedMedia.sort_order)
          if (Number.isFinite(uploadedSortOrder)) {
            nextRemoteSortOrder = Math.max(nextRemoteSortOrder, uploadedSortOrder + 1)
          }

          await db.runAsync(
            `
              UPDATE offline_journal_media
              SET
                remote_id = ?,
                remote_url = ?,
                sync_status = ?,
                updated_at = ?
              WHERE local_id = ?
            `,
            [
              uploadedMedia.id,
              getJournalMediaPublicUrl(uploadedMedia.file_path),
              'synced',
              new Date().toISOString(),
              media.local_id,
            ]
          )
        } catch (mediaError) {
          console.error('Error sincronizando foto local:', media.local_id, mediaError)

          mediaFailed += 1

          await db.runAsync(
            `
              UPDATE offline_journal_media
              SET sync_status = ?, updated_at = ?
              WHERE local_id = ?
            `,
            ['failed', new Date().toISOString(), media.local_id]
          )
        }
      }

      if (mediaFailed > 0) {
        await db.runAsync(
          `
            UPDATE offline_journals
            SET sync_status = ?, updated_at = ?
            WHERE local_id = ?
          `,
          ['failed', new Date().toISOString(), journal.local_id]
        )

        failed += 1
        continue
      }

      await db.runAsync(
        `
          UPDATE offline_journals
          SET sync_status = ?, updated_at = ?
          WHERE local_id = ?
        `,
        ['synced', new Date().toISOString(), journal.local_id]
      )

      if (journal.remote_id) {
        alreadySynced += 1
      } else {
        synced += 1
      }
    } catch (error) {
      console.error('Error sincronizando bitácora local:', journal.local_id, error)

      await db.runAsync(
        `
          UPDATE offline_journals
          SET sync_status = ?, updated_at = ?
          WHERE local_id = ?
        `,
        ['failed', new Date().toISOString(), journal.local_id]
      )

      failed += 1
    }
  }

  return {
    total: pendingJournals.length,
    synced,
    alreadySynced,
    failed,
  }
}
