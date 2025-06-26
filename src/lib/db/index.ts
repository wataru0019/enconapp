// Database exports
export { getDatabase, closeDatabase } from './database.js';
export { getD1Database, initializeD1Database, initializeD1Schema, isCloudflareEnvironment } from './database-d1.js';

// Repository exports
export { UserRepository } from './users.js';
export { ChatSessionRepository } from './chat-sessions.js';
export { MessageRepository } from './messages.js';
export { UserRepositoryD1, ChatSessionRepositoryD1, MessageRepositoryD1 } from './repositories-d1.js';

// Type exports
export type * from './types.js';

// Import classes for singleton creation
import { UserRepository } from './users.js';
import { ChatSessionRepository } from './chat-sessions.js';
import { MessageRepository } from './messages.js';
import { UserRepositoryD1, ChatSessionRepositoryD1, MessageRepositoryD1 } from './repositories-d1.js';
import { isCloudflareEnvironment } from './database-d1.js';

// Environment-aware repository factory
function createRepositories() {
  if (isCloudflareEnvironment()) {
    // Use D1 repositories in Cloudflare Workers
    return {
      userRepo: new UserRepositoryD1(),
      chatSessionRepo: new ChatSessionRepositoryD1(),
      messageRepo: new MessageRepositoryD1()
    };
  } else {
    // Use SQLite repositories in development
    return {
      userRepo: new UserRepository(),
      chatSessionRepo: new ChatSessionRepository(),
      messageRepo: new MessageRepository()
    };
  }
}

// Initialize repositories based on environment
const repositories = createRepositories();
export const userRepo = repositories.userRepo;
export const chatSessionRepo = repositories.chatSessionRepo;
export const messageRepo = repositories.messageRepo;