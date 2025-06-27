import { getDatabase } from './database.js';
import type { User, CreateUserData } from './types.js';

export class UserRepository {
	private getDb() {
		return getDatabase();
	}

	// Create a new user
	async createUser(userData: CreateUserData): Promise<User> {
		const db = this.getDb();
		const stmt = db.prepare(`
			INSERT INTO users (username, password_hash)
			VALUES (?, ?)
		`);
		
		const result = stmt.run(userData.username, userData.password_hash);
		return (await this.getUserById(result.lastInsertRowid as number))!;
	}

	// Get user by ID
	async getUserById(id: number): Promise<User | null> {
		const db = this.getDb();
		const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
		return stmt.get(id) as User || null;
	}

	// Get user by username
	async getUserByUsername(username: string): Promise<User | null> {
		const db = this.getDb();
		const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
		return stmt.get(username) as User || null;
	}

	// Update user
	updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): User | null {
		const db = this.getDb();
		const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
		if (fields.length === 0) return this.getUserById(id);

		const setClause = fields.map(field => `${field} = ?`).join(', ');
		const values = fields.map(field => updates[field as keyof typeof updates]);
		
		const stmt = db.prepare(`
			UPDATE users 
			SET ${setClause}, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`);
		
		stmt.run(...values, id);
		return this.getUserById(id);
	}

	// Delete user
	deleteUser(id: number): boolean {
		const db = this.getDb();
		const stmt = db.prepare('DELETE FROM users WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	// Check if username exists
	async usernameExists(username: string): Promise<boolean> {
		const db = this.getDb();
		const stmt = db.prepare('SELECT 1 FROM users WHERE username = ?');
		return !!stmt.get(username);
	}
}