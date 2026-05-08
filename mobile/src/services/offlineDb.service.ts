import * as SQLite from 'expo-sqlite'

const DB_NAME = 'summitlog-offline.db'

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null

async function createOrMigrateSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS offline_recorded_trips (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id TEXT,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      sync_status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      distance_m REAL NOT NULL DEFAULT 0,
      duration_s INTEGER NOT NULL DEFAULT 0,
      start_lat REAL,
      start_lng REAL,
      end_lat REAL,
      end_lng REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offline_recorded_trip_points (
      local_id TEXT PRIMARY KEY NOT NULL,
      local_trip_id TEXT NOT NULL,
      remote_trip_id TEXT,
      point_order INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude_m REAL,
      accuracy_m REAL,
      speed_mps REAL,
      heading_deg REAL,
      captured_at TEXT NOT NULL,
      sync_status TEXT NOT NULL,
      FOREIGN KEY(local_trip_id) REFERENCES offline_recorded_trips(local_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_offline_trips_sync_status
      ON offline_recorded_trips(sync_status);

    CREATE INDEX IF NOT EXISTS idx_offline_points_trip_id
      ON offline_recorded_trip_points(local_trip_id);

    CREATE INDEX IF NOT EXISTS idx_offline_points_sync_status
      ON offline_recorded_trip_points(sync_status);
  `)
}

export async function getOfflineDb() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME)
      await createOrMigrateSchema(db)
      return db
    })()
  }

  return databasePromise
}

export async function initOfflineDb() {
  await getOfflineDb()
}