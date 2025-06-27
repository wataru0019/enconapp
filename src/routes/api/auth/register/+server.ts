import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword } from '$lib/auth/password.js';
import { generateToken } from '$lib/auth/jwt.js';
import { JWT_SECRET } from '$env/static/private';
import { 
	UserRepository, 
	UserRepositoryD1, 
	isCloudflareEnvironment,
	initializeD1Database,
	initializeD1Schema 
} from '$lib/db/index.js';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		// Dynamic repository selection based on environment
		let userRepo;
		const isCloudflare = isCloudflareEnvironment();
		const hasD1Binding = !!platform?.env?.DB;
		
		if (isCloudflare) {
			if (hasD1Binding) {
				try {
					initializeD1Database(platform.env.DB);
					
					// Try to initialize schema (but don't fail if it's already done)
					try {
						await initializeD1Schema();
					} catch (schemaError) {
						// Continue anyway - schema might already exist
					}
					
					userRepo = new UserRepositoryD1();
				} catch (d1Error) {
					console.error('D1 initialization failed:', d1Error);
					throw new Error('Failed to initialize D1 database: ' + d1Error.message);
				}
			} else {
				throw new Error('D1 database binding not found. Please check wrangler.toml configuration.');
			}
		} else {
			userRepo = new UserRepository();
		}
		
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
		const exists = await userRepo.usernameExists(username);
		
		if (exists) {
			return json(
				{ error: 'Username already exists' },
				{ status: 409 }
			);
		}

		// Hash password
		const password_hash = await hashPassword(password);

		// Create new user
		const newUser = await userRepo.createUser({
			username,
			password_hash
		});

		// Generate JWT token  
		const jwtSecret = platform?.env?.JWT_SECRET || JWT_SECRET;
		
		const token = generateToken({
			userId: newUser.id,
			username: newUser.username
		}, jwtSecret);

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