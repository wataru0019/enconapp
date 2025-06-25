import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';
import { chatSessionRepo } from '$lib/db/index.js';

export const GET: RequestHandler = async ({ request, params }) => {
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

		const sessionId = parseInt(params.id);
		if (isNaN(sessionId)) {
			return json({ error: 'Invalid session ID' }, { status: 400 });
		}

		// Get chat session with messages
		const session = chatSessionRepo.getChatSessionWithMessages(sessionId);
		if (!session) {
			return json({ error: 'Session not found' }, { status: 404 });
		}

		// Verify that the session belongs to the authenticated user
		if (session.user_id !== payload.userId) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		return json(session);
	} catch (error) {
		console.error('Chat session API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};