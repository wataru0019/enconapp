// Cloudflare D1 repository implementations
import { getD1Database, type D1Database } from './database-d1.js';
import type { 
  User, 
  CreateUserData, 
  ChatSession, 
  CreateChatSessionData, 
  Message, 
  CreateMessageData,
  ChatSessionWithMessages 
} from './types.js';

// Base D1 Repository class
abstract class BaseD1Repository {
  protected getDb(): D1Database {
    return getD1Database();
  }
}

// User Repository for D1
export class UserRepositoryD1 extends BaseD1Repository {
  // Create a new user
  async createUser(userData: CreateUserData): Promise<User> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
    `);
    
    const result = await stmt.bind(userData.username, userData.password_hash).run();
    
    if (!result.success) {
      throw new Error(`Failed to create user: ${result.error}`);
    }
    
    const userId = result.meta.last_row_id!;
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('Failed to retrieve created user');
    }
    
    return user;
  }

  // Get user by ID
  async getUserById(id: number): Promise<User | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return await stmt.bind(id).first<User>();
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return await stmt.bind(username).first<User>();
  }

  // Update user
  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
    const fields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'created_at'
    );
    if (fields.length === 0) return this.getUserById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof typeof updates]);
    
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE users 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    const result = await stmt.bind(...values, id).run();
    
    if (!result.success) {
      throw new Error(`Failed to update user: ${result.error}`);
    }
    
    return this.getUserById(id);
  }

  // Delete user
  async deleteUser(id: number): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && (result.meta.changes || 0) > 0;
  }
}

// Chat Session Repository for D1
export class ChatSessionRepositoryD1 extends BaseD1Repository {
  // Create a new chat session
  async createChatSession(sessionData: CreateChatSessionData): Promise<ChatSession> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO chat_sessions (user_id, level, topic)
      VALUES (?, ?, ?)
    `);
    
    const result = await stmt.bind(
      sessionData.user_id,
      sessionData.level,
      sessionData.topic || null
    ).run();
    
    if (!result.success) {
      throw new Error(`Failed to create chat session: ${result.error}`);
    }
    
    const sessionId = result.meta.last_row_id!;
    const session = await this.getChatSessionById(sessionId);
    if (!session) {
      throw new Error('Failed to retrieve created chat session');
    }
    
    return session;
  }

  // Get chat session by ID
  async getChatSessionById(id: number): Promise<ChatSession | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM chat_sessions WHERE id = ?');
    return await stmt.bind(id).first<ChatSession>();
  }

  // Get chat sessions by user ID
  async getChatSessionsByUserId(userId: number, limit = 50, offset = 0): Promise<ChatSession[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM chat_sessions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const result = await stmt.bind(userId, limit, offset).all<ChatSession>();
    return result.results || [];
  }

  // Get chat session with messages
  async getChatSessionWithMessages(sessionId: number): Promise<ChatSessionWithMessages | null> {
    const session = await this.getChatSessionById(sessionId);
    if (!session) return null;

    const db = this.getDb();
    const messagesStmt = db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC
    `);
    
    const messagesResult = await messagesStmt.bind(sessionId).all<Message>();
    const messages = messagesResult.results || [];
    
    return {
      ...session,
      messages
    } as ChatSessionWithMessages;
  }

  // Update chat session
  async updateChatSession(id: number, updates: Partial<Omit<ChatSession, 'id' | 'user_id' | 'created_at'>>): Promise<ChatSession | null> {
    const fields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'user_id' && key !== 'created_at'
    );
    if (fields.length === 0) return this.getChatSessionById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof typeof updates]);
    
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE chat_sessions 
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    const result = await stmt.bind(...values, id).run();
    
    if (!result.success) {
      throw new Error(`Failed to update chat session: ${result.error}`);
    }
    
    return this.getChatSessionById(id);
  }

  // Delete chat session
  async deleteChatSession(id: number): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM chat_sessions WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && (result.meta.changes || 0) > 0;
  }

  // Get recent chat sessions for user
  async getRecentChatSessions(userId: number, limit = 10): Promise<ChatSession[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM chat_sessions 
      WHERE user_id = ? 
      ORDER BY updated_at DESC 
      LIMIT ?
    `);
    const result = await stmt.bind(userId, limit).all<ChatSession>();
    return result.results || [];
  }
}

// Message Repository for D1
export class MessageRepositoryD1 extends BaseD1Repository {
  // Create a new message
  async createMessage(messageData: CreateMessageData): Promise<Message> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO messages (session_id, sender, message)
      VALUES (?, ?, ?)
    `);
    
    const result = await stmt.bind(
      messageData.session_id,
      messageData.sender,
      messageData.message
    ).run();
    
    if (!result.success) {
      throw new Error(`Failed to create message: ${result.error}`);
    }
    
    const messageId = result.meta.last_row_id!;
    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error('Failed to retrieve created message');
    }
    
    return message;
  }

  // Get message by ID
  async getMessageById(id: number): Promise<Message | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
    return await stmt.bind(id).first<Message>();
  }

  // Get messages by session ID
  async getMessagesBySessionId(sessionId: number, limit = 100, offset = 0): Promise<Message[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC 
      LIMIT ? OFFSET ?
    `);
    const result = await stmt.bind(sessionId, limit, offset).all<Message>();
    return result.results || [];
  }

  // Delete message
  async deleteMessage(id: number): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && (result.meta.changes || 0) > 0;
  }

  // Delete messages by session ID
  async deleteMessagesBySessionId(sessionId: number): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM messages WHERE session_id = ?');
    const result = await stmt.bind(sessionId).run();
    return result.success;
  }
}