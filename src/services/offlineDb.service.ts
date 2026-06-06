import * as SQLite from 'expo-sqlite'

const DB_NAME = 'summitlog-offline.db'

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null

async function getTableColumns(db: SQLite.SQLiteDatabase, tableName: string) {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`)
  return new Set(rows.map((row) => row.name))
}

async function addColumnIfMissing(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnDefinition: string
) {
  const columns = await getTableColumns(db, tableName)

  if (!columns.has(columnName)) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`)
  }
}

async function createOrMigrateSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
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
      elevation_gain_m REAL NOT NULL DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS offline_journals (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id TEXT,
      local_trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'private',
      difficulty TEXT,
      category TEXT,
      comments_enabled INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(local_trip_id) REFERENCES offline_recorded_trips(local_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS offline_journal_media (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id TEXT,
      local_journal_id TEXT NOT NULL,
      local_path TEXT NOT NULL,
      remote_url TEXT,
      file_name TEXT,
      mime_type TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(local_journal_id) REFERENCES offline_journals(local_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_offline_trips_sync_status
      ON offline_recorded_trips(sync_status);

    CREATE INDEX IF NOT EXISTS idx_offline_trips_user_status
      ON offline_recorded_trips(user_id, status, sync_status);

    CREATE INDEX IF NOT EXISTS idx_offline_points_trip_id
      ON offline_recorded_trip_points(local_trip_id);

    CREATE INDEX IF NOT EXISTS idx_offline_points_sync_status
      ON offline_recorded_trip_points(sync_status);

    CREATE INDEX IF NOT EXISTS idx_offline_journals_trip_id
      ON offline_journals(local_trip_id);

    CREATE INDEX IF NOT EXISTS idx_offline_journals_user_status
      ON offline_journals(user_id, sync_status);

    CREATE INDEX IF NOT EXISTS idx_offline_media_journal_id
      ON offline_journal_media(local_journal_id);

    CREATE INDEX IF NOT EXISTS idx_offline_media_sync_status
      ON offline_journal_media(sync_status);
  `)

  await addColumnIfMissing(
    db,
    'offline_recorded_trips',
    'elevation_gain_m',
    'REAL NOT NULL DEFAULT 0'
  )

  await addColumnIfMissing(db, 'offline_journals', 'remote_id', 'TEXT')
  await addColumnIfMissing(db, 'offline_journals', 'visibility', "TEXT NOT NULL DEFAULT 'private'")
  await addColumnIfMissing(db, 'offline_journals', 'difficulty', 'TEXT')
  await addColumnIfMissing(db, 'offline_journals', 'category', 'TEXT')
  await addColumnIfMissing(db, 'offline_journals', 'comments_enabled', 'INTEGER NOT NULL DEFAULT 1')
  await addColumnIfMissing(db, 'offline_journals', 'sync_status', "TEXT NOT NULL DEFAULT 'pending'")
  await addColumnIfMissing(db, 'offline_journals', 'created_at', "TEXT NOT NULL DEFAULT ''")
  await addColumnIfMissing(db, 'offline_journals', 'updated_at', "TEXT NOT NULL DEFAULT ''")

  await addColumnIfMissing(db, 'offline_journal_media', 'remote_id', 'TEXT')
  await addColumnIfMissing(db, 'offline_journal_media', 'local_path', "TEXT NOT NULL DEFAULT ''")
  await addColumnIfMissing(db, 'offline_journal_media', 'remote_url', 'TEXT')
  await addColumnIfMissing(db, 'offline_journal_media', 'file_name', 'TEXT')
  await addColumnIfMissing(db, 'offline_journal_media', 'mime_type', 'TEXT')
  await addColumnIfMissing(db, 'offline_journal_media', 'sort_order', 'INTEGER NOT NULL DEFAULT 0')
  await addColumnIfMissing(db, 'offline_journal_media', 'sync_status', "TEXT NOT NULL DEFAULT 'pending'")
  await addColumnIfMissing(db, 'offline_journal_media', 'created_at', "TEXT NOT NULL DEFAULT ''")
  await addColumnIfMissing(db, 'offline_journal_media', 'updated_at', "TEXT NOT NULL DEFAULT ''")
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