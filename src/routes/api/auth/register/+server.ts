import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword } from '$lib/auth/password.js';
import { generateToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';
import { userRepo } from '$lib/db/index.js';

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
		if (userRepo.usernameExists(username)) {
			return json(
				{ error: 'Username already exists' },
				{ status: 409 }
			);
		}

		// Hash password
		const password_hash = await hashPassword(password);

		// Create new user
		const newUser = userRepo.createUser({
			username,
			password_hash
		});

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