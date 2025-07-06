import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userRepo, translationHistoryRepo } from '$lib/db';
import { verifyToken } from '$lib/auth/jwt';

// GET - Fetch user's translation history
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Verify JWT token
		const token = authHeader.substring(7);
		const decoded = verifyToken(token);
		if (!decoded) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Get user from database
		const user = await userRepo.getUserById(decoded.userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Parse query parameters
		const search = url.searchParams.get('search');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		let translations;

		if (search) {
			// Search translations
			translations = await translationHistoryRepo.searchTranslations(user.id, search);
		} else {
			// Get all translations with pagination
			translations = await translationHistoryRepo.getTranslationsByUserId(user.id, limit, offset);
		}

		const totalCount = await translationHistoryRepo.countTranslations(user.id);

		return json({
			translations,
			totalCount,
			hasMore: offset + limit < totalCount
		});

	} catch (error) {
		console.error('Translation history GET API error:', error);
		return json({ 
			error: 'Failed to fetch translation history. Please try again later.' 
		}, { status: 500 });
	}
};

// DELETE - Clear old translation history (keep latest 100)
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Verify JWT token
		const token = authHeader.substring(7);
		const decoded = verifyToken(token);
		if (!decoded) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Get user from database
		const user = await userRepo.getUserById(decoded.userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Delete old translations (keep latest 100)
		const deletedCount = await translationHistoryRepo.deleteOldTranslations(user.id, 100);

		return json({ 
			success: true, 
			deletedCount,
			message: `Deleted ${deletedCount} old translation entries` 
		});

	} catch (error) {
		console.error('Translation history DELETE API error:', error);
		return json({ 
			error: 'Failed to clear translation history. Please try again later.' 
		}, { status: 500 });
	}
};