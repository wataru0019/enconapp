import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const anthropic = new Anthropic({
	apiKey: ANTHROPIC_API_KEY,
});

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface ChatResponse {
	message: string;
	error?: string;
}

export async function sendChatMessage(
	messages: ChatMessage[],
	level: string = '初級者'
): Promise<ChatResponse> {
	try {
		const systemPrompt = createSystemPrompt(level);
		
		const response = await anthropic.messages.create({
			model: 'claude-3-5-haiku-20241022',
			max_tokens: 1000,
			system: systemPrompt,
			messages: messages.map(msg => ({
				role: msg.role,
				content: msg.content
			}))
		});

		const content = response.content[0];
		if (content.type === 'text') {
			return { message: content.text };
		} else {
			return { message: 'Sorry, I could not process your message.', error: 'Invalid response type' };
		}
	} catch (error) {
		console.error('Claude API error:', error);
		return { 
			message: 'Sorry, I\'m having trouble responding right now. Please try again later.',
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

export async function translateWord(word: string): Promise<ChatResponse> {
	try {
		const response = await anthropic.messages.create({
			model: 'claude-3-5-haiku-20241022',
			max_tokens: 500,
			system: 'You are a helpful English-Japanese dictionary. Provide translations, pronunciations, and example sentences. Always respond in Japanese for definitions, but keep the English word and pronunciation in English.',
			messages: [{
				role: 'user',
				content: `Please provide the Japanese translation, pronunciation, and a simple example sentence for the English word: "${word}"`
			}]
		});

		const content = response.content[0];
		if (content.type === 'text') {
			return { message: content.text };
		} else {
			return { message: '申し訳ありません。辞書機能で問題が発生しました。', error: 'Invalid response type' };
		}
	} catch (error) {
		console.error('Dictionary API error:', error);
		return { 
			message: '申し訳ありません。辞書機能で問題が発生しました。しばらく待ってからもう一度お試しください。',
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

function createSystemPrompt(level: string): string {
	const basePrompt = `You are a friendly English conversation partner helping Japanese learners practice English. 

IMPORTANT RULES:
1. ALWAYS respond in English, regardless of the user's input language
2. If the user writes in Japanese, respond in English but acknowledge their Japanese input
3. Keep your responses conversational and natural
4. Encourage the user to continue practicing English
5. Correct mistakes gently by modeling the correct usage in your response`;

	const levelPrompts = {
		'初級者': `${basePrompt}
6. Use simple vocabulary and short sentences
7. Speak slowly and clearly (avoid complex grammar)
8. Ask simple questions to keep the conversation going
9. If needed, explain difficult words in simple English`,

		'中級者': `${basePrompt}
6. Use intermediate vocabulary and varied sentence structures
7. Introduce some idioms and common expressions
8. Ask follow-up questions to encourage detailed responses
9. Provide gentle corrections when needed`,

		'上級者': `${basePrompt}
6. Use advanced vocabulary and complex sentence structures
7. Discuss abstract topics and nuanced concepts
8. Challenge the user with thought-provoking questions
9. Provide detailed feedback on language use when appropriate`
	};

	return levelPrompts[level as keyof typeof levelPrompts] || levelPrompts['初級者'];
}