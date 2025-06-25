import { writable, get } from 'svelte/store';
import { auth, getToken } from './auth.js';

export interface ChatMessage {
	sender: 'user' | 'assistant';
	message: string;
	timestamp: Date;
}

export interface ChatSession {
	id: number;
	level: 'beginner' | 'intermediate' | 'advanced';
	topic?: string;
	messages: ChatMessage[];
	created_at: string;
	updated_at: string;
}

export const currentChat = writable<ChatMessage[]>([]);
export const chatHistory = writable<ChatSession[]>([]);
export const isLoading = writable<boolean>(false);
export const currentSessionId = writable<number | null>(null);

export function addMessage(message: ChatMessage) {
	currentChat.update(messages => [...messages, message]);
}

export async function sendMessage(message: string, level: 'beginner' | 'intermediate' | 'advanced'): Promise<void> {
	const authState = get(auth);
	const token = getToken();
	if (!authState.isAuthenticated || !token) {
		throw new Error('User not authenticated');
	}

	const userMessage: ChatMessage = {
		sender: 'user',
		message,
		timestamp: new Date()
	};
	
	addMessage(userMessage);
	isLoading.set(true);

	try {
		// Get current conversation history
		const messages = get(currentChat);
		const sessionId = get(currentSessionId);

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({
				messages: messages,
				level: level,
				sessionId: sessionId
			})
		});

		if (response.ok) {
			const data = await response.json();
			const botMessage: ChatMessage = {
				sender: 'assistant',
				message: data.message,
				timestamp: new Date(data.timestamp)
			};
			addMessage(botMessage);
			
			// Update session ID if it's a new session
			if (data.sessionId && !sessionId) {
				currentSessionId.set(data.sessionId);
			}
		} else {
			const errorData = await response.json();
			const errorMessage: ChatMessage = {
				sender: 'assistant',
				message: 'Sorry, I\'m having trouble responding right now. Please try again later.',
				timestamp: new Date()
			};
			addMessage(errorMessage);
			console.error('Chat API error:', errorData.error);
		}
	} catch (error) {
		const errorMessage: ChatMessage = {
			sender: 'assistant',
			message: 'Sorry, there was a connection error. Please try again.',
			timestamp: new Date()
		};
		addMessage(errorMessage);
		console.error('Network error:', error);
	} finally {
		isLoading.set(false);
	}
}

export function startNewChat(level: 'beginner' | 'intermediate' | 'advanced') {
	const initialMessages: ChatMessage[] = [
		{ 
			sender: 'assistant', 
			message: 'Hello! I\'m your English conversation partner. Let\'s practice together! How are you doing today?',
			timestamp: new Date()
		}
	];
	currentChat.set(initialMessages);
	currentSessionId.set(null); // Reset session ID for new chat
}

// Load chat history from API
export async function loadChatHistory(): Promise<void> {
	const authState = get(auth);
	const token = getToken();
	if (!authState.isAuthenticated || !token) {
		return;
	}

	try {
		const response = await fetch('/api/chat/history', {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			chatHistory.set(data.sessions || []);
		}
	} catch (error) {
		console.error('Failed to load chat history:', error);
	}
}

// Load specific chat session
export async function loadChatSession(sessionId: number): Promise<void> {
	const authState = get(auth);
	const token = getToken();
	if (!authState.isAuthenticated || !token) {
		return;
	}

	try {
		const response = await fetch(`/api/chat/session/${sessionId}`, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (response.ok) {
			const session = await response.json();
			const messages = session.messages.map((msg: any) => ({
				sender: msg.sender,
				message: msg.message,
				timestamp: new Date(msg.created_at)
			}));
			
			currentChat.set(messages);
			currentSessionId.set(sessionId);
		}
	} catch (error) {
		console.error('Failed to load chat session:', error);
	}
}