import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userRepo, vocabularyRepo } from '$lib/db';
import { verifyToken } from '$lib/auth/jwt';
import { JWT_SECRET } from '$env/static/private';

// PUT - Update vocabulary word
export const PUT: RequestHandler = async ({ request, params, platform }) => {
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

		// Parse vocabulary ID
		const vocabularyId = parseInt(params.id);
		if (isNaN(vocabularyId)) {
			return json({ error: 'Invalid vocabulary ID' }, { status: 400 });
		}

		// Check if vocabulary exists and belongs to user
		const existingVocabulary = await vocabularyRepo.getVocabularyById(vocabularyId);
		if (!existingVocabulary) {
			return json({ error: 'Vocabulary word not found' }, { status: 404 });
		}
		if (existingVocabulary.user_id !== user.id) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Parse request body
		const { japaneseWord, englishTranslation, category, difficultyLevel, notes } = await request.json();

		// Update vocabulary word
		const updatedVocabulary = await vocabularyRepo.updateVocabulary(vocabularyId, {
			japanese_word: japaneseWord?.trim(),
			english_translation: englishTranslation?.trim(),
			category: category?.trim(),
			difficulty_level: difficultyLevel,
			notes: notes?.trim()
		});

		if (!updatedVocabulary) {
			return json({ error: 'Failed to update vocabulary word' }, { status: 500 });
		}

		return json(updatedVocabulary);

	} catch (error) {
		console.error('Vocabulary PUT API error:', error);
		return json({ 
			error: 'Failed to update vocabulary word. Please try again later.' 
		}, { status: 500 });
	}
};

// DELETE - Delete vocabulary word
export const DELETE: RequestHandler = async ({ request, params, platform }) => {
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

		// Parse vocabulary ID
		const vocabularyId = parseInt(params.id);
		if (isNaN(vocabularyId)) {
			return json({ error: 'Invalid vocabulary ID' }, { status: 400 });
		}

		// Check if vocabulary exists and belongs to user
		const existingVocabulary = await vocabularyRepo.getVocabularyById(vocabularyId);
		if (!existingVocabulary) {
			return json({ error: 'Vocabulary word not found' }, { status: 404 });
		}
		if (existingVocabulary.user_id !== user.id) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Delete vocabulary word
		const deleted = await vocabularyRepo.deleteVocabulary(vocabularyId);
		if (!deleted) {
			return json({ error: 'Failed to delete vocabulary word' }, { status: 500 });
		}

		return json({ success: true });

	} catch (error) {
		console.error('Vocabulary DELETE API error:', error);
		return json({ 
			error: 'Failed to delete vocabulary word. Please try again later.' 
		}, { status: 500 });
	}
};