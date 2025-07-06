// Cloudflare D1 repository implementations
import { getD1Database, type D1Database } from './database-d1.js';
import type { 
  User, 
  CreateUserData, 
  ChatSession, 
  CreateChatSessionData, 
  Message, 
  CreateMessageData,
  ChatSessionWithMessages,
  VocabularyWord,
  CreateVocabularyData,
  UpdateVocabularyData,
  TranslationHistory,
  CreateTranslationData
} from './types.js';

// Base D1 Repository class
abstract class BaseD1Repository {
  protected getDb(): D1Database {
    try {
      const db = getD1Database();
      console.log('D1 database retrieved successfully');
      return db;
    } catch (error) {
      console.error('Failed to get D1 database:', error);
      throw error;
    }
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

  // Check if username exists
  async usernameExists(username: string): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT 1 FROM users WHERE username = ?');
    const result = await stmt.bind(username).first();
    return !!result;
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

// Vocabulary Repository for D1
export class VocabularyRepositoryD1 extends BaseD1Repository {
  // Create a new vocabulary word
  async createVocabulary(data: CreateVocabularyData): Promise<VocabularyWord> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO vocabulary (
        user_id, japanese_word, english_translation, 
        category, difficulty_level, notes, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      data.user_id,
      data.japanese_word,
      data.english_translation,
      data.category || 'general',
      data.difficulty_level || 'beginner',
      data.notes || null,
      data.source || 'manual'
    ).run();
    
    if (!result.success) {
      throw new Error(`Failed to create vocabulary: ${result.error}`);
    }
    
    const vocabId = result.meta.last_row_id!;
    const vocab = await this.getVocabularyById(vocabId);
    if (!vocab) {
      throw new Error('Failed to retrieve created vocabulary');
    }
    
    return vocab;
  }

  // Get vocabulary by ID
  async getVocabularyById(id: number): Promise<VocabularyWord | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM vocabulary WHERE id = ?');
    return await stmt.bind(id).first<VocabularyWord>();
  }

  // Get vocabulary by user ID
  async getVocabularyByUserId(userId: number, limit = 50, offset = 0): Promise<VocabularyWord[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM vocabulary 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const result = await stmt.bind(userId, limit, offset).all<VocabularyWord>();
    return result.results || [];
  }

  // Get vocabulary by category
  async getVocabularyByCategory(userId: number, category: string): Promise<VocabularyWord[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM vocabulary 
      WHERE user_id = ? AND category = ? 
      ORDER BY created_at DESC
    `);
    const result = await stmt.bind(userId, category).all<VocabularyWord>();
    return result.results || [];
  }

  // Get categories for user
  async getCategories(userId: number): Promise<string[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT DISTINCT category 
      FROM vocabulary 
      WHERE user_id = ? 
      ORDER BY category
    `);
    const result = await stmt.bind(userId).all<{category: string}>();
    return (result.results || []).map(row => row.category);
  }

  // Update vocabulary
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
      return this.getVocabularyById(id);
    }

    updateFields.push('updated_at = datetime(\'now\')');
    values.push(id);

    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE vocabulary 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);
    
    const result = await stmt.bind(...values).run();
    
    if (!result.success) {
      throw new Error(`Failed to update vocabulary: ${result.error}`);
    }
    
    return this.getVocabularyById(id);
  }

  // Delete vocabulary
  async deleteVocabulary(id: number): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM vocabulary WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && (result.meta.changes || 0) > 0;
  }

  // Search vocabulary
  async searchVocabulary(userId: number, query: string): Promise<VocabularyWord[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM vocabulary 
      WHERE user_id = ? 
      AND (japanese_word LIKE ? OR english_translation LIKE ? OR notes LIKE ?)
      ORDER BY created_at DESC
    `);
    const searchPattern = `%${query}%`;
    const result = await stmt.bind(userId, searchPattern, searchPattern, searchPattern).all<VocabularyWord>();
    return result.results || [];
  }

  // Count vocabulary for user
  async countVocabulary(userId: number): Promise<number> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM vocabulary WHERE user_id = ?');
    const result = await stmt.bind(userId).first<{count: number}>();
    return result?.count || 0;
  }
}

// Translation History Repository for D1
export class TranslationHistoryRepositoryD1 extends BaseD1Repository {
  // Create a new translation
  async createTranslation(data: CreateTranslationData): Promise<TranslationHistory> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO translation_history (
        user_id, japanese_text, english_translation, 
        grammar_feedback, natural_suggestion
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      data.user_id,
      data.japanese_text,
      data.english_translation,
      data.grammar_feedback || null,
      data.natural_suggestion || null
    ).run();
    
    if (!result.success) {
      throw new Error(`Failed to create translation: ${result.error}`);
    }
    
    const translationId = result.meta.last_row_id!;
    const translation = await this.getTranslationById(translationId);
    if (!translation) {
      throw new Error('Failed to retrieve created translation');
    }
    
    return translation;
  }

  // Get translation by ID
  async getTranslationById(id: number): Promise<TranslationHistory | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM translation_history WHERE id = ?');
    return await stmt.bind(id).first<TranslationHistory>();
  }

  // Get translations by user ID
  async getTranslationsByUserId(userId: number, limit = 50, offset = 0): Promise<TranslationHistory[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM translation_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const result = await stmt.bind(userId, limit, offset).all<TranslationHistory>();
    return result.results || [];
  }

  // Delete translation
  async deleteTranslation(id: number): Promise<boolean> {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM translation_history WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && (result.meta.changes || 0) > 0;
  }

  // Search translations
  async searchTranslations(userId: number, query: string): Promise<TranslationHistory[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM translation_history 
      WHERE user_id = ? 
      AND (japanese_text LIKE ? OR english_translation LIKE ?)
      ORDER BY created_at DESC
    `);
    const searchPattern = `%${query}%`;
    const result = await stmt.bind(userId, searchPattern, searchPattern).all<TranslationHistory>();
    return result.results || [];
  }

  // Count translations for user
  async countTranslations(userId: number): Promise<number> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM translation_history WHERE user_id = ?');
    const result = await stmt.bind(userId).first<{count: number}>();
    return result?.count || 0;
  }

  // Delete old translations (keep latest N)
  async deleteOldTranslations(userId: number, keepCount = 100): Promise<number> {
    const db = this.getDb();
    const stmt = db.prepare(`
      DELETE FROM translation_history 
      WHERE user_id = ? 
      AND id NOT IN (
        SELECT id FROM translation_history 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      )
    `);
    const result = await stmt.bind(userId, userId, keepCount).run();
    return result.meta.changes || 0;
  }
}