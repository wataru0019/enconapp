import type { Database } from 'better-sqlite3';
import type { VocabularyWord, CreateVocabularyData, UpdateVocabularyData } from './types.js';

export class VocabularyRepository {
	constructor(private db: Database) {}

	async createVocabulary(data: CreateVocabularyData): Promise<VocabularyWord> {
		const stmt = this.db.prepare(`
			INSERT INTO vocabulary (
				user_id, japanese_word, english_translation, 
				category, difficulty_level, notes, source
			) VALUES (?, ?, ?, ?, ?, ?, ?)
		`);
		
		const result = stmt.run(
			data.user_id,
			data.japanese_word,
			data.english_translation,
			data.category || 'general',
			data.difficulty_level || 'beginner',
			data.notes || null,
			data.source || 'manual'
		);

		return (await this.getVocabularyById(result.lastInsertRowid as number))!;
	}

	async getVocabularyById(id: number): Promise<VocabularyWord | null> {
		const stmt = this.db.prepare('SELECT * FROM vocabulary WHERE id = ?');
		return stmt.get(id) as VocabularyWord | null;
	}

	async getVocabularyByUserId(userId: number, limit = 50, offset = 0): Promise<VocabularyWord[]> {
		const stmt = this.db.prepare(`
			SELECT * FROM vocabulary 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT ? OFFSET ?
		`);
		return stmt.all(userId, limit, offset) as VocabularyWord[];
	}

	async getVocabularyByCategory(userId: number, category: string): Promise<VocabularyWord[]> {
		const stmt = this.db.prepare(`
			SELECT * FROM vocabulary 
			WHERE user_id = ? AND category = ? 
			ORDER BY created_at DESC
		`);
		return stmt.all(userId, category) as VocabularyWord[];
	}

	getCategories(userId: number): string[] {
		const stmt = this.db.prepare(`
			SELECT DISTINCT category 
			FROM vocabulary 
			WHERE user_id = ? 
			ORDER BY category
		`);
		return stmt.all(userId).map((row: any) => row.category);
	}

	async updateVocabulary(id: number, data: UpdateVocabularyData): Promise<VocabularyWord | null> {
		const updateFields = [];
		const values = [];

		if (data.japanese_word !== undefined) {
			updateFields.push('japanese_word = ?');
			values.push(data.japanese_word);
		}
		if (data.english_translation !== undefined) {
			updateFields.push('english_translation = ?');
			values.push(data.english_translation);
		}
		if (data.category !== undefined) {
			updateFields.push('category = ?');
			values.push(data.category);
		}
		if (data.difficulty_level !== undefined) {
			updateFields.push('difficulty_level = ?');
			values.push(data.difficulty_level);
		}
		if (data.notes !== undefined) {
			updateFields.push('notes = ?');
			values.push(data.notes);
		}

		if (updateFields.length === 0) {
			return await this.getVocabularyById(id);
		}

		updateFields.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);

		const stmt = this.db.prepare(`
			UPDATE vocabulary 
			SET ${updateFields.join(', ')} 
			WHERE id = ?
		`);
		
		stmt.run(...values);
		return await this.getVocabularyById(id);
	}

	async deleteVocabulary(id: number): Promise<boolean> {
		const stmt = this.db.prepare('DELETE FROM vocabulary WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	async searchVocabulary(userId: number, query: string): Promise<VocabularyWord[]> {
		const stmt = this.db.prepare(`
			SELECT * FROM vocabulary 
			WHERE user_id = ? 
			AND (japanese_word LIKE ? OR english_translation LIKE ? OR notes LIKE ?)
			ORDER BY created_at DESC
		`);
		const searchPattern = `%${query}%`;
		return stmt.all(userId, searchPattern, searchPattern, searchPattern) as VocabularyWord[];
	}

	async countVocabulary(userId: number): Promise<number> {
		const stmt = this.db.prepare('SELECT COUNT(*) as count FROM vocabulary WHERE user_id = ?');
		const result = stmt.get(userId) as { count: number };
		return result.count;
	}
}