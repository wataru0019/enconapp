import type { Database } from 'better-sqlite3';
import type { TranslationHistory, CreateTranslationData } from './types.js';

export class TranslationHistoryRepository {
	constructor(private db: Database) {}

	async create(data: CreateTranslationData): Promise<TranslationHistory> {
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

		return this.findById(result.lastInsertRowid as number)!;
	}

	findById(id: number): TranslationHistory | null {
		const stmt = this.db.prepare('SELECT * FROM translation_history WHERE id = ?');
		return stmt.get(id) as TranslationHistory | null;
	}

	findByUserId(userId: number, limit = 50, offset = 0): TranslationHistory[] {
		const stmt = this.db.prepare(`
			SELECT * FROM translation_history 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT ? OFFSET ?
		`);
		return stmt.all(userId, limit, offset) as TranslationHistory[];
	}

	delete(id: number): boolean {
		const stmt = this.db.prepare('DELETE FROM translation_history WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	search(userId: number, query: string): TranslationHistory[] {
		const stmt = this.db.prepare(`
			SELECT * FROM translation_history 
			WHERE user_id = ? 
			AND (japanese_text LIKE ? OR english_translation LIKE ?)
			ORDER BY created_at DESC
		`);
		const searchPattern = `%${query}%`;
		return stmt.all(userId, searchPattern, searchPattern) as TranslationHistory[];
	}

	count(userId: number): number {
		const stmt = this.db.prepare('SELECT COUNT(*) as count FROM translation_history WHERE user_id = ?');
		const result = stmt.get(userId) as { count: number };
		return result.count;
	}

	deleteOldEntries(userId: number, keepCount = 100): number {
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