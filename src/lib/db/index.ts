// Database exports
export { getDatabase, closeDatabase } from './database.js';

// Repository exports
export { UserRepository } from './users.js';
export { ChatSessionRepository } from './chat-sessions.js';
export { MessageRepository } from './messages.js';

// Type exports
export type * from './types.js';

// Import classes for singleton creation
import { UserRepository } from './users.js';
import { ChatSessionRepository } from './chat-sessions.js';
import { MessageRepository } from './messages.js';

// Initialize repositories as singletons
export const userRepo = new UserRepository();
export const chatSessionRepo = new ChatSessionRepository();
export const messageRepo = new MessageRepository();