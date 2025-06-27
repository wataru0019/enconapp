import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPassword } from '$lib/auth/password.js';
import { generateToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';
import { userRepo } from '$lib/db/index.js';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json(
				{ error: 'Username and password are required' },
				{ status: 400 }
			);
		}

		// Find user
		const user = await userRepo.getUserByUsername(username);
		if (!user) {
			return json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			);
		}

		// Verify password
		const isValid = await verifyPassword(password, user.password_hash);
		if (!isValid) {
			return json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			);
		}

		// Generate JWT token
		const jwtSecret = platform?.env?.JWT_SECRET || JWT_SECRET;
		const token = generateToken({
			userId: user.id,
			username: user.username
		}, jwtSecret);

		return json({
			token,
			user: {
				id: user.id,
				username: user.username
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};