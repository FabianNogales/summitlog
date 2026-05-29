import { getOfflineDb } from './offlineDb.service'
import type {
  OfflineRecordedTrip,
  OfflineRecordedTripPoint,
} from '../types/offlineTrip'

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

interface CreateOfflineTripParams {
  userId: string
  startLat: number
  startLng: number
}

interface AddOfflineTripPointParams {
  localTripId: string
  pointOrder: number
  latitude: number
  longitude: number
  altitudeM?: number | null
  accuracyM?: number | null
  speedMps?: number | null
  headingDeg?: number | null
  capturedAt?: string
}

interface AddOfflineTripPointAutoOrderParams {
  localTripId: string
  latitude: number
  longitude: number
  altitudeM?: number | null
  accuracyM?: number | null
  speedMps?: number | null
  headingDeg?: number | null
  capturedAt?: string
}

interface CompleteOfflineTripParams {
  localTripId: string
  endedAt: string
  durationS: number
  distanceM: number
  endLat: number
  endLng: number
}

export async function createOfflineRecordedTrip(params: CreateOfflineTripParams) {
  const db = await getOfflineDb()
  const now = new Date().toISOString()
  const localId = createLocalId('trip')

  await db.runAsync(
    `
      INSERT INTO offline_recorded_trips (
        local_id,
        remote_id,
        user_id,
        status,
        sync_status,
        started_at,
        ended_at,
        distance_m,
        duration_s,
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localId,
      null,
      params.userId,
      'recording',
      'pending',
      now,
      null,
      0,
      0,
      params.startLat,
      params.startLng,
      null,
      null,
      now,
      now,
    ]
  )

  return getOfflineRecordedTripById(localId)
}

export async function addOfflineRecordedTripPoint(params: AddOfflineTripPointParams) {
  const db = await getOfflineDb()
  const localId = createLocalId('point')

  await db.runAsync(
    `
      INSERT INTO offline_recorded_trip_points (
        local_id,
        local_trip_id,
        remote_trip_id,
        point_order,
        latitude,
        longitude,
        altitude_m,
        accuracy_m,
        speed_mps,
        heading_deg,
        captured_at,
        sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      localId,
      params.localTripId,
      null,
      params.pointOrder,
      params.latitude,
      params.longitude,
      params.altitudeM ?? null,
      params.accuracyM ?? null,
      params.speedMps ?? null,
      params.headingDeg ?? null,
      params.capturedAt ?? new Date().toISOString(),
      'pending',
    ]
  )

  return getOfflineRecordedTripPointById(localId)
}

export async function addOfflineRecordedTripPointWithAutoOrder(
  params: AddOfflineTripPointAutoOrderParams
) {
  const db = await getOfflineDb()

  const orderRow = await db.getFirstAsync<{ max_order: number | null }>(
    `
      SELECT MAX(point_order) as max_order
      FROM offline_recorded_trip_points
      WHERE local_trip_id = ?
    `,
    [params.localTripId]
  )

  const nextPointOrder = Number(orderRow?.max_order ?? -1) + 1

  return addOfflineRecordedTripPoint({
    localTripId: params.localTripId,
    pointOrder: nextPointOrder,
    latitude: params.latitude,
    longitude: params.longitude,
    altitudeM: params.altitudeM ?? null,
    accuracyM: params.accuracyM ?? null,
    speedMps: params.speedMps ?? null,
    headingDeg: params.headingDeg ?? null,
    capturedAt: params.capturedAt,
  })
}

export async function completeOfflineRecordedTrip(params: CompleteOfflineTripParams) {
  const db = await getOfflineDb()

  await db.runAsync(
    `
      UPDATE offline_recorded_trips
      SET
        status = ?,
        sync_status = ?,
        ended_at = ?,
        duration_s = ?,
        distance_m = ?,
        end_lat = ?,
        end_lng = ?,
        updated_at = ?
      WHERE local_id = ?
    `,
    [
      'completed',
      'pending',
      params.endedAt,
      params.durationS,
      params.distanceM,
      params.endLat,
      params.endLng,
      new Date().toISOString(),
      params.localTripId,
    ]
  )

  return getOfflineRecordedTripById(params.localTripId)
}

export async function getOfflineRecordedTripById(localTripId: string) {
  const db = await getOfflineDb()

  const row = await db.getFirstAsync<OfflineRecordedTrip>(
    `
      SELECT *
      FROM offline_recorded_trips
      WHERE local_id = ?
    `,
    [localTripId]
  )

  return row ?? null
}

export async function getOfflineRecordedTripByRemoteId(remoteTripId: string) {
  const db = await getOfflineDb()

  const row = await db.getFirstAsync<OfflineRecordedTrip>(
    `
      SELECT *
      FROM offline_recorded_trips
      WHERE remote_id = ?
      LIMIT 1
    `,
    [remoteTripId]
  )

  return row ?? null
}

export async function getOfflineRecordedTripByLocalOrRemoteId(tripId: string) {
  const localTrip = await getOfflineRecordedTripById(tripId)

  if (localTrip) {
    return localTrip
  }

  return getOfflineRecordedTripByRemoteId(tripId)
}

export async function getOfflineRecordedTripPointById(localPointId: string) {
  const db = await getOfflineDb()

  const row = await db.getFirstAsync<OfflineRecordedTripPoint>(
    `
      SELECT *
      FROM offline_recorded_trip_points
      WHERE local_id = ?
    `,
    [localPointId]
  )

  return row ?? null
}

export async function getOfflineTripPointsByTripId(localTripId: string) {
  const db = await getOfflineDb()

  const rows = await db.getAllAsync<OfflineRecordedTripPoint>(
    `
      SELECT *
      FROM offline_recorded_trip_points
      WHERE local_trip_id = ?
      ORDER BY point_order ASC
    `,
    [localTripId]
  )

  return rows
}

export async function getPendingOfflineTripPointsByTripId(localTripId: string) {
  const db = await getOfflineDb()

  const rows = await db.getAllAsync<OfflineRecordedTripPoint>(
    `
      SELECT *
      FROM offline_recorded_trip_points
      WHERE local_trip_id = ?
      AND sync_status IN ('pending', 'failed', 'syncing')
      ORDER BY point_order ASC
    `,
    [localTripId]
  )

  return rows
}

export async function getPendingOfflineTripsByUser(userId: string) {
  const db = await getOfflineDb()

  const rows = await db.getAllAsync<OfflineRecordedTrip>(
    `
      SELECT *
      FROM offline_recorded_trips
      WHERE user_id = ?
      AND status = 'completed'
      AND sync_status IN ('pending', 'failed', 'syncing')
      ORDER BY started_at DESC
    `,
    [userId]
  )

  return rows
}

export async function setOfflineTripRemoteId(localTripId: string, remoteId: string) {
  const db = await getOfflineDb()

  const result = await db.runAsync(
    `
      UPDATE offline_recorded_trips
      SET
        remote_id = ?,
        updated_at = ?
      WHERE local_id = ?
    `,
    [remoteId, new Date().toISOString(), localTripId]
  )

  return result.changes > 0
}

export async function markOfflineTripSyncing(localTripId: string) {
  const db = await getOfflineDb()

  const result = await db.runAsync(
    `
      UPDATE offline_recorded_trips
      SET
        sync_status = ?,
        updated_at = ?
      WHERE local_id = ?
      AND status = 'completed'
      AND sync_status IN ('pending', 'failed', 'syncing')
    `,
    ['syncing', new Date().toISOString(), localTripId]
  )

  return result.changes > 0
}

export async function markOfflineTripSynced(localTripId: string, remoteId: string) {
  const db = await getOfflineDb()

  await db.runAsync(
    `
      UPDATE offline_recorded_trips
      SET
        remote_id = ?,
        sync_status = ?,
        updated_at = ?
      WHERE local_id = ?
    `,
    [remoteId, 'synced', new Date().toISOString(), localTripId]
  )
}

export async function markOfflineTripFailed(localTripId: string) {
  const db = await getOfflineDb()

  await db.runAsync(
    `
      UPDATE offline_recorded_trips
      SET
        sync_status = ?,
        updated_at = ?
      WHERE local_id = ?
    `,
    ['failed', new Date().toISOString(), localTripId]
  )
}

export async function markOfflineTripPointsSynced(
  localTripId: string,
  remoteTripId: string
) {
  const db = await getOfflineDb()

  await db.runAsync(
    `
      UPDATE offline_recorded_trip_points
      SET
        remote_trip_id = ?,
        sync_status = ?
      WHERE local_trip_id = ?
    `,
    [remoteTripId, 'synced', localTripId]
  )
}

export async function markOfflineTripPointsSyncedByPointOrders(
  localTripId: string,
  remoteTripId: string,
  pointOrders: number[]
) {
  if (pointOrders.length === 0) {
    return
  }

  const db = await getOfflineDb()
  const placeholders = pointOrders.map(() => '?').join(',')

  await db.runAsync(
    `
      UPDATE offline_recorded_trip_points
      SET
        remote_trip_id = ?,
        sync_status = ?
      WHERE local_trip_id = ?
      AND point_order IN (${placeholders})
    `,
    [remoteTripId, 'synced', localTripId, ...pointOrders]
  )
}