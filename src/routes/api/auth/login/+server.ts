import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPassword } from '$lib/auth/password.js';
import { generateToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';

// Temporary user storage (will be replaced with database in Phase 3)
const users = [
	{
		id: 1,
		username: 'demo',
		password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // password
	}
];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json(
				{ error: 'Username and password are required' },
				{ status: 400 }
			);
		}

		// Find user
		const user = users.find(u => u.username === username);
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
		const token = generateToken({
			userId: user.id,
			username: user.username
		}, JWT_SECRET);

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