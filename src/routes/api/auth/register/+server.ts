import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword } from '$lib/auth/password.js';
import { generateToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';

// Temporary user storage (will be replaced with database in Phase 3)
let users = [
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

		if (password.length < 6) {
			return json(
				{ error: 'Password must be at least 6 characters long' },
				{ status: 400 }
			);
		}

		// Check if user already exists
		const existingUser = users.find(u => u.username === username);
		if (existingUser) {
			return json(
				{ error: 'Username already exists' },
				{ status: 409 }
			);
		}

		// Hash password
		const password_hash = await hashPassword(password);

		// Create new user
		const newUser = {
			id: users.length + 1,
			username,
			password_hash
		};

		users.push(newUser);

		// Generate JWT token
		const token = generateToken({
			userId: newUser.id,
			username: newUser.username
		}, JWT_SECRET);

		return json({
			token,
			user: {
				id: newUser.id,
				username: newUser.username
			}
		});
	} catch (error) {
		console.error('Registration error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};