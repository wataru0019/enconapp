// Cloudflare D1 database adapter for production


// Type for Cloudflare D1 database
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
  dump(): Promise<ArrayBuffer>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = any>(): Promise<D1Result<T>>;
}

export interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    served_by?: string;
    duration?: number;
    changes?: number;
    last_row_id?: number;
    changed_db?: boolean;
    size_after?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

let database: D1Database | null = null;

// Initialize D1 database (called from platform context)
export function initializeD1Database(db: D1Database): void {
  database = db;
}

// Get the D1 database instance
export function getD1Database(): D1Database {
  if (!database) {
    throw new Error('D1 database not initialized. Make sure to call initializeD1Database() with the database binding.');
  }
  return database;
}

// Initialize database schema for D1 using embedded SQL
export async function initializeD1Schema(): Promise<void> {
  const db = getD1Database();
  
  try {
    // Embedded schema (Cloudflare Workers can't read files at runtime)
    const schemaStatements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
        topic TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
        message TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
      `CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`
    ];
    
    for (const statement of schemaStatements) {
      try {
        await db.prepare(statement).run();
      } catch (error) {
        console.error('Failed to execute SQL statement:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to initialize D1 schema:', error);
    throw error;
  }
}

// Check if we're running in Cloudflare Workers environment
export function isCloudflareEnvironment(): boolean {
  // Multiple checks for Cloudflare Workers environment
  const hasCloudflareGlobals = typeof globalThis.caches !== 'undefined' && 
                               typeof globalThis.crypto !== 'undefined' &&
                               typeof globalThis.fetch !== 'undefined';
  
  const hasWorkersSpecific = typeof globalThis.Request !== 'undefined' && 
                            typeof globalThis.Response !== 'undefined';
  
  const isNotNode = typeof globalThis.process === 'undefined' && 
                    typeof globalThis.Buffer === 'undefined';
  
  const hasCloudflareUserAgent = typeof globalThis.navigator !== 'undefined' && 
                                globalThis.navigator.userAgent === 'Cloudflare-Workers';
  
  return isNotNode && hasCloudflareGlobals && hasWorkersSpecific || hasCloudflareUserAgent;
}