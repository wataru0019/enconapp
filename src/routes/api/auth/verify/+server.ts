import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { token } = await request.json();

		if (!token) {
			return json(
				{ error: 'Token is required' },
				{ status: 400 }
			);
		}

		// Use JWT_SECRET from platform or fallback
		const jwtSecret = platform?.env?.JWT_SECRET || JWT_SECRET;
		
		const payload = verifyToken(token, jwtSecret);
		if (!payload) {
			return json(
				{ error: 'Invalid or expired token' },
				{ status: 401 }
			);
		}

		return json({
			valid: true,
			user: {
				id: payload.userId,
				username: payload.username
			}
		});
	} catch (error) {
		console.error('Token verification error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};