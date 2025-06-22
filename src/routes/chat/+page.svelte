<script lang="ts">
	import { currentChat, sendMessage as sendChatMessage, isLoading } from '$lib/stores/chat';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	
	let currentMessage = '';
	let showDictionary = false;
	let level = '';
	let dictionaryWord = '';
	let dictionaryResult = '';

	onMount(() => {
		const unsubscribe = user.subscribe(($user) => {
			if (!$user.isLoggedIn) {
				goto('/login');
			}
		});

		level = $page.url.searchParams.get('level') || '初級者';
		
		return unsubscribe;
	});

	async function sendMessage() {
		if (currentMessage.trim() && !$isLoading) {
			const message = currentMessage;
			currentMessage = '';
			await sendChatMessage(message, level);
		}
	}

	async function searchDictionary() {
		if (!dictionaryWord.trim()) return;
		
		try {
			const response = await fetch('/api/dictionary', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					word: dictionaryWord
				})
			});

			if (response.ok) {
				const data = await response.json();
				dictionaryResult = data.translation;
			} else {
				dictionaryResult = '辞書検索でエラーが発生しました。';
			}
		} catch (error) {
			dictionaryResult = '接続エラーが発生しました。';
			console.error('Dictionary error:', error);
		}
	}

	function toggleDictionary() {
		showDictionary = !showDictionary;
	}

	function goBack() {
		goto('/main');
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			sendMessage();
		}
	}
</script>

<div class="chat-screen">
	<div class="header">
		<button class="back-button" on:click={goBack}>←</button>
		<h2>{level}</h2>
		<button class="dictionary-button" on:click={toggleDictionary}>辞書</button>
	</div>
	<div class="chat-messages">
		{#each $currentChat as message}
			<div class="message {message.sender}">
				{message.message}
			</div>
		{/each}
		{#if $isLoading}
			<div class="message bot loading">
				<div class="typing-indicator">
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		{/if}
	</div>
	<div class="chat-input">
		<input 
			type="text" 
			bind:value={currentMessage} 
			placeholder="Type your message in English..." 
			on:keypress={handleKeyPress}
			disabled={$isLoading}
		/>
		<button on:click={sendMessage} class="send-button" disabled={$isLoading}>→</button>
	</div>
</div>

{#if showDictionary}
	<div class="dictionary-overlay" on:click={toggleDictionary}></div>
	<div class="dictionary-panel" transition:slide={{ duration: 300, axis: 'x' }}>
		<div class="dictionary-header">
			<h3>辞書</h3>
			<button class="close-button" on:click={toggleDictionary}>×</button>
		</div>
		<div class="dictionary-content">
			<div class="dictionary-search">
				<input 
					type="text" 
					bind:value={dictionaryWord}
					placeholder="単語を入力してください" 
					on:keypress={(e) => e.key === 'Enter' && searchDictionary()}
				/>
				<button class="search-button" on:click={searchDictionary}>🔍</button>
			</div>
			{#if dictionaryResult}
				<div class="dictionary-result">
					<div class="translation-content">
						{dictionaryResult}
					</div>
				</div>
			{:else}
				<div class="dictionary-placeholder">
					<p>単語を検索して意味を調べましょう</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.chat-screen {
		min-height: 100vh;
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
		margin-bottom: 20px;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
	}

	.dictionary-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 15px;
		cursor: pointer;
		font-size: 14px;
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 20px 0;
		max-height: 70vh;
	}

	.message {
		margin: 10px 0;
		padding: 12px;
		border-radius: 15px;
		max-width: 80%;
	}

	.message.bot {
		background: #f0f0f0;
		margin-right: auto;
	}

	.message.user {
		background: #4285f4;
		color: white;
		margin-left: auto;
	}

	.chat-input {
		display: flex;
		align-items: center;
		background: #f0f0f0;
		border-radius: 25px;
		padding: 5px;
		margin-top: 20px;
	}

	.chat-input input {
		flex: 1;
		border: none;
		background: none;
		padding: 10px 15px;
		font-size: 16px;
	}

	.send-button {
		background: none;
		border: none;
		font-size: 18px;
		cursor: pointer;
		padding: 10px;
	}

	.dictionary-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}

	.dictionary-panel {
		position: fixed;
		top: 0;
		right: 0;
		width: 300px;
		height: 100%;
		background: white;
		box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
		z-index: 1000;
		overflow-y: auto;
		padding: 20px;
		box-sizing: border-box;
	}

	.dictionary-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		border-bottom: 1px solid #eee;
		padding-bottom: 15px;
	}

	.dictionary-header h3 {
		margin: 0;
		color: #333;
		font-size: 18px;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #666;
		padding: 5px;
	}

	.close-button:hover {
		color: #333;
	}

	.dictionary-content {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.dictionary-search {
		display: flex;
		gap: 10px;
	}

	.dictionary-search input {
		flex: 1;
		padding: 12px;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 16px;
		box-sizing: border-box;
	}

	.dictionary-search input:focus {
		outline: none;
		border-color: #4285f4;
	}

	.search-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 10px 15px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 16px;
		min-width: 50px;
	}

	.dictionary-result {
		background: #f9f9f9;
		border-radius: 10px;
		padding: 15px;
		border-left: 4px solid #4285f4;
	}

	.translation-content {
		white-space: pre-wrap;
		line-height: 1.6;
		color: #333;
	}

	.dictionary-placeholder {
		text-align: center;
		color: #666;
		padding: 40px 20px;
	}

	.loading {
		opacity: 0.8;
	}

	.typing-indicator {
		display: flex;
		gap: 4px;
		align-items: center;
		padding: 8px 0;
	}

	.typing-indicator span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #666;
		animation: typing 1.4s infinite ease-in-out;
	}

	.typing-indicator span:nth-child(1) {
		animation-delay: 0s;
	}

	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		30% {
			transform: translateY(-10px);
			opacity: 1;
		}
	}

	.chat-input input:disabled,
	.chat-input button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>