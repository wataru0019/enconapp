import { json } from '@sveltejs/kit';
import { sendChatMessage, type ChatMessage } from '$lib/services/claude';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';
import { chatSessionRepo, messageRepo } from '$lib/db/index.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Verify authentication
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Authorization required' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		const payload = verifyToken(token, JWT_SECRET);
		if (!payload) {
			return json({ error: 'Invalid or expired token' }, { status: 401 });
		}

		const { messages, level, sessionId } = await request.json();
		
		if (!messages || !Array.isArray(messages)) {
			return json({ error: 'Invalid messages format' }, { status: 400 });
		}

		if (!level) {
			return json({ error: 'Level is required' }, { status: 400 });
		}

		// Validate level value
		const validLevels = ['beginner', 'intermediate', 'advanced'] as const;
		if (!validLevels.includes(level)) {
			console.error('Invalid level value:', level);
			return json({ error: `Invalid level: ${level}. Must be one of: ${validLevels.join(', ')}` }, { status: 400 });
		}

		// Get or create chat session
		let currentSessionId = sessionId;
		if (!currentSessionId) {
			const session = chatSessionRepo.createChatSession({
				user_id: payload.userId,
				level: level as 'beginner' | 'intermediate' | 'advanced'
			});
			currentSessionId = session.id;
		}

		// Save user message to database
		const userMessage = messages[messages.length - 1];
		if (userMessage && userMessage.sender === 'user') {
			messageRepo.createMessage({
				session_id: currentSessionId,
				sender: 'user',
				message: userMessage.message
			});
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

		// Save assistant response to database
		const assistantMessage = messageRepo.createMessage({
			session_id: currentSessionId,
			sender: 'assistant',
			message: response.message
		});

		return json({ 
			message: response.message,
			sender: 'assistant',
			timestamp: assistantMessage.created_at,
			sessionId: currentSessionId
		});
	} catch (error) {
		console.error('Chat API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};