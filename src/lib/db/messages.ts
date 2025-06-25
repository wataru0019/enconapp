import { getDatabase } from './database.js';
import type { Message, CreateMessageData } from './types.js';

export class MessageRepository {
	private getDb() {
		return getDatabase();
	}

	// Create a new message
	createMessage(messageData: CreateMessageData): Message {
		const db = this.getDb();
		const stmt = db.prepare(`
			INSERT INTO messages (session_id, sender, message)
			VALUES (?, ?, ?)
		`);
		
		const result = stmt.run(
			messageData.session_id,
			messageData.sender,
			messageData.message
		);
		
		return this.getMessageById(result.lastInsertRowid as number)!;
	}

	// Get message by ID
	getMessageById(id: number): Message | null {
		const db = this.getDb();
		const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
		return stmt.get(id) as Message || null;
	}

	// Get messages by session ID
	getMessagesBySessionId(sessionId: number): Message[] {
		const db = this.getDb();
		const stmt = db.prepare(`
			SELECT * FROM messages 
			WHERE session_id = ? 
			ORDER BY created_at ASC
		`);
		return stmt.all(sessionId) as Message[];
	}

	// Get recent messages by session ID with limit
	getRecentMessagesBySessionId(sessionId: number, limit = 50): Message[] {
		const db = this.getDb();
		const stmt = db.prepare(`
			SELECT * FROM messages 
			WHERE session_id = ? 
			ORDER BY created_at DESC 
			LIMIT ?
		`);
		const messages = stmt.all(sessionId, limit) as Message[];
		return messages.reverse(); // Return in chronological order
	}

	// Delete message
	deleteMessage(id: number): boolean {
		const db = this.getDb();
		const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	// Delete all messages in a session
	deleteMessagesBySessionId(sessionId: number): number {
		const db = this.getDb();
		const stmt = db.prepare('DELETE FROM messages WHERE session_id = ?');
		const result = stmt.run(sessionId);
		return result.changes;
	}

	// Create multiple messages in a transaction
	createMessages(messages: CreateMessageData[]): Message[] {
		const db = this.getDb();
		const insertStmt = db.prepare(`
			INSERT INTO messages (session_id, sender, message)
			VALUES (?, ?, ?)
		`);

		const selectStmt = db.prepare('SELECT * FROM messages WHERE id = ?');

		const transaction = db.transaction(() => {
			const createdMessages: Message[] = [];
			for (const messageData of messages) {
				const result = insertStmt.run(
					messageData.session_id,
					messageData.sender,
					messageData.message
				);
				const message = selectStmt.get(result.lastInsertRowid as number) as Message;
				createdMessages.push(message);
			}
			return createdMessages;
		});

		return transaction();
	}
}