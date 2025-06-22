import { json } from '@sveltejs/kit';
import { sendChatMessage, type ChatMessage } from '$lib/services/claude';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages, level } = await request.json();
		
		if (!messages || !Array.isArray(messages)) {
			return json({ error: 'Invalid messages format' }, { status: 400 });
		}

		// Convert messages to Claude format
		const claudeMessages: ChatMessage[] = messages.map((msg: any) => ({
			role: msg.sender === 'user' ? 'user' : 'assistant',
			content: msg.message
		}));

		const response = await sendChatMessage(claudeMessages, level);
		
		if (response.error) {
			return json({ error: response.error }, { status: 500 });
		}

		return json({ 
			message: response.message,
			sender: 'bot',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Chat API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};