import type { Database } from 'better-sqlite3';
import type { VocabularyWord, CreateVocabularyData, UpdateVocabularyData } from './types.js';

export class VocabularyRepository {
	constructor(private db: Database) {}

	async create(data: CreateVocabularyData): Promise<VocabularyWord> {
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

		return this.findById(result.lastInsertRowid as number)!;
	}

	findById(id: number): VocabularyWord | null {
		const stmt = this.db.prepare('SELECT * FROM vocabulary WHERE id = ?');
		return stmt.get(id) as VocabularyWord | null;
	}

	findByUserId(userId: number, limit = 50, offset = 0): VocabularyWord[] {
		const stmt = this.db.prepare(`
			SELECT * FROM vocabulary 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT ? OFFSET ?
		`);
		return stmt.all(userId, limit, offset) as VocabularyWord[];
	}

	findByCategory(userId: number, category: string): VocabularyWord[] {
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

	update(id: number, data: UpdateVocabularyData): VocabularyWord | null {
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
			return this.findById(id);
		}

		updateFields.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);

		const stmt = this.db.prepare(`
			UPDATE vocabulary 
			SET ${updateFields.join(', ')} 
			WHERE id = ?
		`);
		
		stmt.run(...values);
		return this.findById(id);
	}

	delete(id: number): boolean {
		const stmt = this.db.prepare('DELETE FROM vocabulary WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	search(userId: number, query: string): VocabularyWord[] {
		const stmt = this.db.prepare(`
			SELECT * FROM vocabulary 
			WHERE user_id = ? 
			AND (japanese_word LIKE ? OR english_translation LIKE ? OR notes LIKE ?)
			ORDER BY created_at DESC
		`);
		const searchPattern = `%${query}%`;
		return stmt.all(userId, searchPattern, searchPattern, searchPattern) as VocabularyWord[];
	}

	count(userId: number): number {
		const stmt = this.db.prepare('SELECT COUNT(*) as count FROM vocabulary WHERE user_id = ?');
		const result = stmt.get(userId) as { count: number };
		return result.count;
	}
}