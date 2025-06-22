import { writable } from 'svelte/store';

export interface ChatMessage {
	sender: 'user' | 'bot';
	message: string;
	timestamp: Date;
}

export interface ChatSession {
	id: string;
	level: string;
	topic: string;
	messages: ChatMessage[];
	createdAt: Date;
}

export const currentChat = writable<ChatMessage[]>([]);
export const chatHistory = writable<ChatSession[]>([]);
export const isLoading = writable<boolean>(false);

export function addMessage(message: ChatMessage) {
	currentChat.update(messages => [...messages, message]);
}

export async function sendMessage(message: string, level: string): Promise<void> {
	const userMessage: ChatMessage = {
		sender: 'user',
		message,
		timestamp: new Date()
	};
	
	addMessage(userMessage);
	isLoading.set(true);

	try {
		// Get current conversation history
		let messages: ChatMessage[] = [];
		currentChat.subscribe(msgs => messages = msgs)();

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages: messages,
				level: level
			})
		});

		if (response.ok) {
			const data = await response.json();
			const botMessage: ChatMessage = {
				sender: 'bot',
				message: data.message,
				timestamp: new Date()
			};
			addMessage(botMessage);
		} else {
			const errorData = await response.json();
			const errorMessage: ChatMessage = {
				sender: 'bot',
				message: 'Sorry, I\'m having trouble responding right now. Please try again later.',
				timestamp: new Date()
			};
			addMessage(errorMessage);
			console.error('Chat API error:', errorData.error);
		}
	} catch (error) {
		const errorMessage: ChatMessage = {
			sender: 'bot',
			message: 'Sorry, there was a connection error. Please try again.',
			timestamp: new Date()
		};
		addMessage(errorMessage);
		console.error('Network error:', error);
	} finally {
		isLoading.set(false);
	}
}

export function startNewChat(level: string) {
	const initialMessages: ChatMessage[] = [
		{ 
			sender: 'bot', 
			message: 'Hello! I\'m your English conversation partner. Let\'s practice together! How are you doing today?',
			timestamp: new Date()
		}
	];
	currentChat.set(initialMessages);
}

export function saveChatSession(level: string, topic: string = 'General conversation') {
	currentChat.subscribe(messages => {
		if (messages.length > 1) { // Only save if there's more than just the initial message
			const session: ChatSession = {
				id: Date.now().toString(),
				level,
				topic,
				messages: [...messages],
				createdAt: new Date()
			};
			chatHistory.update(history => [session, ...history]);
		}
	})();
}