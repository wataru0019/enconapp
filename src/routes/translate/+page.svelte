<script lang="ts">
	import { isAuthenticated, auth } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getToken } from '$lib/auth';

	let japaneseText = '';
	let translationResult = null;
	let isLoading = false;
	let error = '';

	onMount(() => {
		const unsubscribe = isAuthenticated.subscribe(($isAuthenticated) => {
			if (!$isAuthenticated) {
				goto('/login');
			}
		});
		return unsubscribe;
	});

	function goBack() {
		goto('/main');
	}

	function logout() {
		auth.logout();
		goto('/login');
	}

	async function translateText() {
		if (!japaneseText.trim() || isLoading) return;

		isLoading = true;
		error = '';
		translationResult = null;

		try {
			const token = getToken();
			const response = await fetch('/api/translate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					japaneseText: japaneseText.trim()
				})
			});

			if (response.ok) {
				translationResult = await response.json();
			} else {
				const errorData = await response.json();
				error = errorData.error || '翻訳に失敗しました。';
			}
		} catch (err) {
			error = '接続エラーが発生しました。';
			console.error('Translation error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function addToVocabulary(japaneseWord, englishTranslation) {
		try {
			const token = getToken();
			const response = await fetch('/api/vocabulary', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					japaneseWord,
					englishTranslation,
					source: 'translation'
				})
			});

			if (response.ok) {
				alert('単語帳に追加されました！');
			} else {
				alert('単語帳への追加に失敗しました。');
			}
		} catch (err) {
			alert('エラーが発生しました。');
			console.error('Add to vocabulary error:', err);
		}
	}

	function clearInput() {
		japaneseText = '';
		translationResult = null;
		error = '';
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			translateText();
		}
	}
</script>

<div class="translate-screen">
	<div class="header">
		<button class="back-button" on:click={goBack}>←</button>
		<h2>和英翻訳</h2>
		<button class="logout-button" on:click={logout}>ログアウト</button>
	</div>

	<div class="content">
		<div class="input-section">
			<label for="japanese-input">日本語を入力してください</label>
			<textarea
				id="japanese-input"
				bind:value={japaneseText}
				placeholder="例：今日はとても良い天気ですね。"
				on:keydown={handleKeyPress}
				disabled={isLoading}
				rows="4"
			></textarea>
			<div class="input-actions">
				<button class="clear-button" on:click={clearInput} disabled={isLoading}>
					クリア
				</button>
				<button class="translate-button" on:click={translateText} disabled={!japaneseText.trim() || isLoading}>
					{isLoading ? '翻訳中...' : '翻訳する'}
				</button>
			</div>
		</div>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		{#if translationResult}
			<div class="result-section">
				<div class="translation-card">
					<h3>翻訳結果</h3>
					<div class="translation-text">
						{translationResult.translation}
					</div>
					<button 
						class="add-vocab-button" 
						on:click={() => addToVocabulary(japaneseText.trim(), translationResult.translation)}
					>
						単語帳に追加
					</button>
				</div>

				{#if translationResult.naturalSuggestion && translationResult.naturalSuggestion !== translationResult.translation}
					<div class="suggestion-card">
						<h4>より自然な表現</h4>
						<div class="suggestion-text">
							{translationResult.naturalSuggestion}
						</div>
					</div>
				{/if}

				{#if translationResult.grammarFeedback}
					<div class="feedback-card">
						<h4>文法フィードバック</h4>
						<div class="feedback-text">
							{translationResult.grammarFeedback}
						</div>
					</div>
				{/if}

				{#if translationResult.explanation}
					<div class="explanation-card">
						<h4>翻訳の解説</h4>
						<div class="explanation-text">
							{translationResult.explanation}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.translate-screen {
		min-height: 100vh;
		min-height: 100dvh;
		background: white;
		padding: 20px;
		box-sizing: border-box;
		max-width: 400px;
		margin: 0 auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		display: flex;
		flex-direction: column;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 30px;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
	}

	.logout-button {
		background: #ff4444;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 14px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.logout-button:hover {
		background: #cc3333;
	}

	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.input-section {
		background: #f9f9f9;
		border-radius: 15px;
		padding: 20px;
	}

	.input-section label {
		display: block;
		font-weight: 600;
		margin-bottom: 10px;
		color: #333;
	}

	.input-section textarea {
		width: 100%;
		border: 2px solid #ddd;
		border-radius: 10px;
		padding: 15px;
		font-size: 16px;
		font-family: inherit;
		resize: vertical;
		min-height: 100px;
		box-sizing: border-box;
	}

	.input-section textarea:focus {
		outline: none;
		border-color: #4285f4;
	}

	.input-actions {
		display: flex;
		gap: 10px;
		margin-top: 15px;
		justify-content: flex-end;
	}

	.clear-button {
		background: #666;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
	}

	.translate-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
	}

	.translate-button:disabled,
	.clear-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-message {
		background: #ffe6e6;
		color: #d32f2f;
		padding: 15px;
		border-radius: 10px;
		border-left: 4px solid #d32f2f;
	}

	.result-section {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.translation-card, .suggestion-card, .feedback-card, .explanation-card {
		background: white;
		border-radius: 10px;
		padding: 20px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border: 1px solid #eee;
	}

	.translation-card h3 {
		margin: 0 0 15px 0;
		color: #333;
		font-size: 18px;
	}

	.suggestion-card h4, .feedback-card h4, .explanation-card h4 {
		margin: 0 0 10px 0;
		color: #333;
		font-size: 16px;
		font-weight: 600;
	}

	.translation-text {
		font-size: 18px;
		line-height: 1.6;
		color: #2e7d32;
		font-weight: 500;
		margin-bottom: 15px;
		padding: 15px;
		background: #e8f5e8;
		border-radius: 8px;
	}

	.suggestion-text {
		font-size: 16px;
		line-height: 1.6;
		color: #1976d2;
		background: #e3f2fd;
		padding: 12px;
		border-radius: 8px;
	}

	.feedback-text {
		font-size: 14px;
		line-height: 1.6;
		color: #f57c00;
		background: #fff3e0;
		padding: 12px;
		border-radius: 8px;
	}

	.explanation-text {
		font-size: 14px;
		line-height: 1.6;
		color: #666;
		background: #f5f5f5;
		padding: 12px;
		border-radius: 8px;
	}

	.add-vocab-button {
		background: #2e7d32;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}

	.add-vocab-button:hover {
		background: #1b5e20;
	}
</style>