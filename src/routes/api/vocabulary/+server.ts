import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userRepo, vocabularyRepo } from '$lib/db';
import { verifyToken } from '$lib/auth/jwt';
import { JWT_SECRET } from '$env/static/private';

// GET - Fetch user's vocabulary
export const GET: RequestHandler = async ({ request, url, platform }) => {
	try {
		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Verify JWT token
		const token = authHeader.substring(7);
		
		// Use JWT_SECRET from platform or fallback
		const jwtSecret = platform?.env?.JWT_SECRET || JWT_SECRET;
		
		const decoded = verifyToken(token, jwtSecret);
		if (!decoded) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Get user from database
		const user = await userRepo.getUserById(decoded.userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Parse query parameters
		const category = url.searchParams.get('category');
		const search = url.searchParams.get('search');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		let vocabulary;

		if (search) {
			// Search vocabulary
			vocabulary = await vocabularyRepo.searchVocabulary(user.id, search);
		} else if (category && category !== 'all') {
			// Filter by category
			vocabulary = await vocabularyRepo.getVocabularyByCategory(user.id, category);
		} else {
			// Get all vocabulary with pagination
			vocabulary = await vocabularyRepo.getVocabularyByUserId(user.id, limit, offset);
		}

		// Get categories for filter options
		const categories = await vocabularyRepo.getCategories(user.id);
		const totalCount = await vocabularyRepo.countVocabulary(user.id);

		return json({
			vocabulary,
			categories,
			totalCount,
			hasMore: offset + limit < totalCount
		});

	} catch (error) {
		console.error('Vocabulary GET API error:', error);
		return json({ 
			error: 'Failed to fetch vocabulary. Please try again later.' 
		}, { status: 500 });
	}
};

// POST - Create new vocabulary word
export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		// Get authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Verify JWT token
		const token = authHeader.substring(7);
		
		// Use JWT_SECRET from platform or fallback
		const jwtSecret = platform?.env?.JWT_SECRET || JWT_SECRET;
		
		const decoded = verifyToken(token, jwtSecret);
		if (!decoded) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Get user from database
		const user = await userRepo.getUserById(decoded.userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Parse request body
		const { japaneseWord, englishTranslation, category, difficultyLevel, notes, source } = await request.json();

		// Validate required fields
		if (!japaneseWord || typeof japaneseWord !== 'string') {
			return json({ error: 'Japanese word is required' }, { status: 400 });
		}
		if (!englishTranslation || typeof englishTranslation !== 'string') {
			return json({ error: 'English translation is required' }, { status: 400 });
		}

		// Create vocabulary word
		const vocabularyWord = await vocabularyRepo.createVocabulary({
			user_id: user.id,
			japanese_word: japaneseWord.trim(),
			english_translation: englishTranslation.trim(),
			category: category?.trim() || 'general',
			difficulty_level: difficultyLevel || 'beginner',
			notes: notes?.trim() || undefined,
			source: source || 'manual'
		});

		return json(vocabularyWord, { status: 201 });

	} catch (error) {
		console.error('Vocabulary POST API error:', error);
		return json({ 
			error: 'Failed to create vocabulary word. Please try again later.' 
		}, { status: 500 });
	}
};