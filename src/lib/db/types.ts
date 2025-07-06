export interface User {
	id: number;
	username: string;
	password_hash: string;
	created_at: string;
	updated_at: string;
}

export interface CreateUserData {
	username: string;
	password_hash: string;
}

export interface ChatSession {
	id: number;
	user_id: number;
	level: 'beginner' | 'intermediate' | 'advanced';
	topic?: string;
	created_at: string;
	updated_at: string;
}

export interface CreateChatSessionData {
	user_id: number;
	level: 'beginner' | 'intermediate' | 'advanced';
	topic?: string;
}

export interface Message {
	id: number;
	session_id: number;
	sender: 'user' | 'assistant';
	message: string;
	created_at: string;
}

export interface CreateMessageData {
	session_id: number;
	sender: 'user' | 'assistant';
	message: string;
}

export interface ChatSessionWithMessages extends ChatSession {
	messages: Message[];
}

export interface VocabularyWord {
	id: number;
	user_id: number;
	japanese_word: string;
	english_translation: string;
	category: string;
	difficulty_level: 'beginner' | 'intermediate' | 'advanced';
	notes?: string;
	source: 'chat' | 'manual' | 'translation';
	created_at: string;
	updated_at: string;
}

export interface CreateVocabularyData {
	user_id: number;
	japanese_word: string;
	english_translation: string;
	category?: string;
	difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
	notes?: string;
	source?: 'chat' | 'manual' | 'translation';
}

export interface UpdateVocabularyData {
	japanese_word?: string;
	english_translation?: string;
	category?: string;
	difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
	notes?: string;
}

export interface TranslationHistory {
	id: number;
	user_id: number;
	japanese_text: string;
	english_translation: string;
	grammar_feedback?: string;
	natural_suggestion?: string;
	created_at: string;
}

export interface CreateTranslationData {
	user_id: number;
	japanese_text: string;
	english_translation: string;
	grammar_feedback?: string;
	natural_suggestion?: string;
}