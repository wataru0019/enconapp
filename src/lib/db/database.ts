import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
	if (db) {
		return db;
	}

	// Create data directory if it doesn't exist
	const dataDir = './data';
	if (!existsSync(dataDir)) {
		mkdirSync(dataDir, { recursive: true });
	}
	const dbPath = join(dataDir, 'app.db');

	try {
		db = new Database(dbPath);
		
		// Enable foreign keys
		db.pragma('foreign_keys = ON');
		
		// Initialize schema
		initializeSchema();
		
		console.log('Database connected successfully');
		return db;
	} catch (error) {
		console.error('Failed to connect to database:', error);
		throw error;
	}
}

function initializeSchema() {
	if (!db) return;

	try {
		// Read and execute schema
		const schemaPath = join(process.cwd(), 'src/lib/db/schema.sql');
		const schema = readFileSync(schemaPath, 'utf-8');
		
		// Remove comments and split into statements
		const cleanSchema = schema
			.split('\n')
			.filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
			.join('\n');
		
		const statements = cleanSchema
			.split(';')
			.map(stmt => stmt.trim())
			.filter(stmt => stmt.length > 0);

		db.transaction(() => {
			for (const statement of statements) {
				if (statement.length > 0) {
					db!.exec(statement);
				}
			}
		})();

		console.log('Database schema initialized');
	} catch (error) {
		console.error('Failed to initialize database schema:', error);
		throw error;
	}
}

export function closeDatabase() {
	if (db) {
		db.close();
		db = null;
		console.log('Database connection closed');
	}
}

// Graceful shutdown
process.on('SIGINT', () => {
	closeDatabase();
	process.exit(0);
});

process.on('SIGTERM', () => {
	closeDatabase();
	process.exit(0);
});