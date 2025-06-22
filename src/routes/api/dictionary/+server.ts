import { json } from '@sveltejs/kit';
import { translateWord } from '$lib/services/claude';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { word } = await request.json();
		
		if (!word || typeof word !== 'string') {
			return json({ error: 'Word is required' }, { status: 400 });
		}

		const response = await translateWord(word.trim());
		
		if (response.error) {
			return json({ error: response.error }, { status: 500 });
		}

		return json({ 
			translation: response.message,
			word: word.trim()
		});
	} catch (error) {
		console.error('Dictionary API error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};