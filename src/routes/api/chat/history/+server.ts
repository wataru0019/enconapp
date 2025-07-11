import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';
import { chatSessionRepo } from '$lib/db/index.js';

export const GET: RequestHandler = async ({ request, url, platform }) => {
	try {
		// Verify authentication
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Authorization required' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		
		// Use JWT_SECRET from platform or fallback
		const jwtSecret = platform?.env?.JWT_SECRET || JWT_SECRET;
		const payload = verifyToken(token, jwtSecret);
		
		if (!payload) {
			return json({ error: 'Invalid or expired token' }, { status: 401 });
		}

		// Get query parameters
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Get chat sessions for the user
		const sessions = await chatSessionRepo.getChatSessionsByUserId(payload.userId, limit, offset);

		return json({
			sessions,
			total: sessions.length
		});
	} catch (error) {
		console.error('Chat history API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};