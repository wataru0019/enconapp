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