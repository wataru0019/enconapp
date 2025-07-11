// Database exports
export { getDatabase, closeDatabase } from './database.js';
export { getD1Database, initializeD1Database, initializeD1Schema, isCloudflareEnvironment } from './database-d1.js';

// Repository exports
export { UserRepository } from './users.js';
export { ChatSessionRepository } from './chat-sessions.js';
export { MessageRepository } from './messages.js';
export { VocabularyRepository } from './vocabulary.js';
export { TranslationHistoryRepository } from './translation-history.js';
export { UserRepositoryD1, ChatSessionRepositoryD1, MessageRepositoryD1, VocabularyRepositoryD1, TranslationHistoryRepositoryD1 } from './repositories-d1.js';

// Type exports
export type * from './types.js';

// Import classes for singleton creation
import { UserRepository } from './users.js';
import { ChatSessionRepository } from './chat-sessions.js';
import { MessageRepository } from './messages.js';
import { VocabularyRepository } from './vocabulary.js';
import { TranslationHistoryRepository } from './translation-history.js';
import { UserRepositoryD1, ChatSessionRepositoryD1, MessageRepositoryD1, VocabularyRepositoryD1, TranslationHistoryRepositoryD1 } from './repositories-d1.js';
import { isCloudflareEnvironment } from './database-d1.js';
import { getDatabase } from './database.js';

// Environment-aware repository factory
function createRepositories() {
  const isCloudflare = isCloudflareEnvironment();
  console.log('Environment detection - isCloudflareEnvironment():', isCloudflare);
  console.log('globalThis.caches:', typeof globalThis.caches);
  console.log('globalThis.navigator:', typeof globalThis.navigator);
  if (typeof globalThis.navigator !== 'undefined') {
    console.log('navigator.userAgent:', globalThis.navigator.userAgent);
  }
  
  if (isCloudflare) {
    console.log('Using D1 repositories for Cloudflare Workers');
    // Use D1 repositories in Cloudflare Workers
    return {
      userRepo: new UserRepositoryD1(),
      chatSessionRepo: new ChatSessionRepositoryD1(),
      messageRepo: new MessageRepositoryD1(),
      vocabularyRepo: new VocabularyRepositoryD1(),
      translationHistoryRepo: new TranslationHistoryRepositoryD1()
    };
  } else {
    console.log('Using SQLite repositories for development');
    // Use SQLite repositories in development
    const db = getDatabase();
    return {
      userRepo: new UserRepository(),
      chatSessionRepo: new ChatSessionRepository(),
      messageRepo: new MessageRepository(),
      vocabularyRepo: new VocabularyRepository(db),
      translationHistoryRepo: new TranslationHistoryRepository(db)
    };
  }
}

// Initialize repositories based on environment
const repositories = createRepositories();
export const userRepo = repositories.userRepo;
export const chatSessionRepo = repositories.chatSessionRepo;
export const messageRepo = repositories.messageRepo;
export const vocabularyRepo = repositories.vocabularyRepo;
export const translationHistoryRepo = repositories.translationHistoryRepo;