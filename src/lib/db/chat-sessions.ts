import { getDatabase } from './database.js';
import type { ChatSession, CreateChatSessionData, ChatSessionWithMessages } from './types.js';

export class ChatSessionRepository {
	private getDb() {
		return getDatabase();
	}

	// Create a new chat session
	createChatSession(sessionData: CreateChatSessionData): ChatSession {
		const db = this.getDb();
		const stmt = db.prepare(`
			INSERT INTO chat_sessions (user_id, level, topic)
			VALUES (?, ?, ?)
		`);
		
		const result = stmt.run(
			sessionData.user_id,
			sessionData.level,
			sessionData.topic || null
		);
		
		return this.getChatSessionById(result.lastInsertRowid as number)!;
	}

	// Get chat session by ID
	getChatSessionById(id: number): ChatSession | null {
		const db = this.getDb();
		const stmt = db.prepare('SELECT * FROM chat_sessions WHERE id = ?');
		return stmt.get(id) as ChatSession || null;
	}

	// Get chat sessions by user ID
	getChatSessionsByUserId(userId: number, limit = 50, offset = 0): ChatSession[] {
		const db = this.getDb();
		const stmt = db.prepare(`
			SELECT * FROM chat_sessions 
			WHERE user_id = ? 
			ORDER BY created_at DESC 
			LIMIT ? OFFSET ?
		`);
		return stmt.all(userId, limit, offset) as ChatSession[];
	}

	// Get chat session with messages
	getChatSessionWithMessages(sessionId: number): ChatSessionWithMessages | null {
		const session = this.getChatSessionById(sessionId);
		if (!session) return null;

		const db = this.getDb();
		const messagesStmt = db.prepare(`
			SELECT * FROM messages 
			WHERE session_id = ? 
			ORDER BY created_at ASC
		`);
		
		const messages = messagesStmt.all(sessionId);
		
		return {
			...session,
			messages
		} as ChatSessionWithMessages;
	}

	// Update chat session
	updateChatSession(id: number, updates: Partial<Omit<ChatSession, 'id' | 'user_id' | 'created_at'>>): ChatSession | null {
		const db = this.getDb();
		const fields = Object.keys(updates).filter(key => 
			key !== 'id' && key !== 'user_id' && key !== 'created_at'
		);
		if (fields.length === 0) return this.getChatSessionById(id);

		const setClause = fields.map(field => `${field} = ?`).join(', ');
		const values = fields.map(field => updates[field as keyof typeof updates]);
		
		const stmt = db.prepare(`
			UPDATE chat_sessions 
			SET ${setClause}, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`);
		
		stmt.run(...values, id);
		return this.getChatSessionById(id);
	}

	// Delete chat session
	deleteChatSession(id: number): boolean {
		const db = this.getDb();
		const stmt = db.prepare('DELETE FROM chat_sessions WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	// Get recent chat sessions for user
	getRecentChatSessions(userId: number, limit = 10): ChatSession[] {
		const db = this.getDb();
		const stmt = db.prepare(`
			SELECT * FROM chat_sessions 
			WHERE user_id = ? 
			ORDER BY updated_at DESC 
			LIMIT ?
		`);
		return stmt.all(userId, limit) as ChatSession[];
	}
}