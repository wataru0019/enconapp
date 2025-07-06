import type { Database } from 'better-sqlite3';
import type { TranslationHistory, CreateTranslationData } from './types.js';

export class TranslationHistoryRepository {
	constructor(private db: Database) {}

	async createTranslation(data: CreateTranslationData): Promise<TranslationHistory> {
		const stmt = this.db.prepare(`
			INSERT INTO translation_history (
				user_id, japanese_text, english_translation, 
				grammar_feedback, natural_suggestion
			) VALUES (?, ?, ?, ?, ?)
		`);
		
		const result = stmt.run(
			data.user_id,
			data.japanese_text,
			data.english_translation,
			data.grammar_feedback || null,
			data.natural_suggestion || null
		);

		return (await this.getTranslationById(result.lastInsertRowid as number))!;
	}

	async getTranslationById(id: number): Promise<TranslationHistory | null> {
		const stmt = this.db.prepare('SELECT * FROM translation_history WHERE id = ?');
		return stmt.get(id) as TranslationHistory | null;
	}

	async getTranslationsByUserId(userId: number, limit = 50, offset = 0): Promise<TranslationHistory[]> {
		const stmt = this.db.prepare(`
			SELECT * FROM translation_history 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT ? OFFSET ?
		`);
		return stmt.all(userId, limit, offset) as TranslationHistory[];
	}

	async deleteTranslation(id: number): Promise<boolean> {
		const stmt = this.db.prepare('DELETE FROM translation_history WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	async searchTranslations(userId: number, query: string): Promise<TranslationHistory[]> {
		const stmt = this.db.prepare(`
			SELECT * FROM translation_history 
			WHERE user_id = ? 
			AND (japanese_text LIKE ? OR english_translation LIKE ?)
			ORDER BY created_at DESC
		`);
		const searchPattern = `%${query}%`;
		return stmt.all(userId, searchPattern, searchPattern) as TranslationHistory[];
	}

	async countTranslations(userId: number): Promise<number> {
		const stmt = this.db.prepare('SELECT COUNT(*) as count FROM translation_history WHERE user_id = ?');
		const result = stmt.get(userId) as { count: number };
		return result.count;
	}

	async deleteOldTranslations(userId: number, keepCount = 100): Promise<number> {
		const stmt = this.db.prepare(`
			DELETE FROM translation_history 
			WHERE user_id = ? 
			AND id NOT IN (
				SELECT id FROM translation_history 
				WHERE user_id = ? 
				ORDER BY created_at DESC 
				LIMIT ?
			)
		`);
		const result = stmt.run(userId, userId, keepCount);
		return result.changes;
	}
}