import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClaude } from '$lib/services/claude';
import { userRepo, translationHistoryRepo } from '$lib/db';
import { verifyToken } from '$lib/auth/jwt';
import { JWT_SECRET } from '$env/static/private';

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
		const { japaneseText } = await request.json();
		if (!japaneseText || typeof japaneseText !== 'string') {
			return json({ error: 'Japanese text is required' }, { status: 400 });
		}

		// Create Claude client
		const claude = createClaude(platform);

		// Create a detailed prompt for translation with grammar feedback
		const prompt = `You are a Japanese-English translation expert and English teacher. 
		
Please translate the following Japanese text to English and provide feedback:

Japanese text: "${japaneseText}"

Please respond in JSON format with the following structure:
{
  "translation": "Direct English translation",
  "grammarFeedback": "Analysis of any grammar issues in the Japanese text (if any)",
  "naturalSuggestion": "A more natural/colloquial English version if different from the direct translation",
  "explanation": "Brief explanation of translation choices or cultural context if relevant"
}

Focus on:
1. Accurate translation that preserves meaning
2. Grammar analysis of the Japanese text
3. Natural English expression
4. Cultural nuances if applicable

Respond only with the JSON, no additional text.`;

		// Send request to Claude
		const response = await claude.messages.create({
			model: 'claude-3-5-haiku-20241022',
			max_tokens: 1000,
			temperature: 0.3,
			messages: [{ role: 'user', content: prompt }]
		});

		const content = response.content[0];
		if (content.type !== 'text') {
			throw new Error('Unexpected response type from Claude API');
		}

		// Parse Claude's response
		let translationData;
		try {
			translationData = JSON.parse(content.text);
		} catch (parseError) {
			console.error('Failed to parse Claude response:', content.text);
			return json({ error: 'Failed to parse translation response' }, { status: 500 });
		}

		// Validate response structure
		if (!translationData.translation) {
			return json({ error: 'Invalid translation response' }, { status: 500 });
		}

		// Save to translation history
		try {
			await translationHistoryRepo.createTranslation({
				user_id: user.id,
				japanese_text: japaneseText,
				english_translation: translationData.translation,
				grammar_feedback: translationData.grammarFeedback || null,
				natural_suggestion: translationData.naturalSuggestion || null
			});
		} catch (dbError) {
			console.error('Failed to save translation history:', dbError);
			// Continue even if saving fails
		}

		return json({
			translation: translationData.translation,
			grammarFeedback: translationData.grammarFeedback,
			naturalSuggestion: translationData.naturalSuggestion,
			explanation: translationData.explanation
		});

	} catch (error) {
		console.error('Translation API error:', error);
		return json({ 
			error: 'Failed to translate text. Please try again later.' 
		}, { status: 500 });
	}
};