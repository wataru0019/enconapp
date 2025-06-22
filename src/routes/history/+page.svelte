<script lang="ts">
	import { chatHistory } from '$lib/stores/chat';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		const unsubscribe = user.subscribe(($user) => {
			if (!$user.isLoggedIn) {
				goto('/login');
			}
		});
		return unsubscribe;
	});

	function goBack() {
		goto('/main');
	}

	function startNewChat() {
		goto('/main');
	}

	function openChat(session: any) {
		// In a real app, you might want to load the specific chat session
		goto(`/chat?level=${encodeURIComponent(session.level)}`);
	}

	// Mock data for demonstration
	const mockHistory = [
		{ id: '1', level: '初級者', topic: 'Recently stock market', createdAt: new Date() },
		{ id: '2', level: '初級者', topic: 'Recently stock market', createdAt: new Date() },
		{ id: '3', level: '初級者', topic: 'Recently stock market', createdAt: new Date() },
		{ id: '4', level: '初級者', topic: 'Recently stock market', createdAt: new Date() },
		{ id: '5', level: '初級者', topic: 'Recently stock market', createdAt: new Date() },
		{ id: '6', level: '初級者', topic: 'Recently stock market', createdAt: new Date() }
	];
</script>

<div class="history-screen">
	<div class="header">
		<button class="back-button" on:click={goBack}>←</button>
		<h2>過去のチャット</h2>
		<div class="header-buttons">
			<button class="search-button">🔍</button>
			<button class="user-button">W</button>
		</div>
	</div>
	<div class="history-list">
		{#each ($chatHistory.length > 0 ? $chatHistory : mockHistory) as session}
			<button class="history-item" on:click={() => openChat(session)}>
				<div class="history-info">
					<span class="level">レベル：{session.level}</span>
					<span class="topic">チャット：{session.topic}</span>
				</div>
			</button>
		{/each}
	</div>
	<button class="new-chat-button" on:click={startNewChat}>+ New Chat</button>
</div>

<style>
	.history-screen {
		min-height: 100vh;
		background: white;
		padding: 20px;
		box-sizing: border-box;
		max-width: 400px;
		margin: 0 auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

	.header-buttons {
		display: flex;
		gap: 10px;
	}

	.search-button, .user-button {
		background: #4285f4;
		color: white;
		border: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.history-list {
		margin: 20px 0;
	}

	.history-item {
		width: 100%;
		padding: 15px;
		border: none;
		border-bottom: 1px solid #eee;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.history-item:hover {
		background: #f9f9f9;
	}

	.history-info {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.level, .topic {
		font-size: 14px;
		color: #666;
	}

	.new-chat-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 25px;
		position: fixed;
		bottom: 20px;
		right: 20px;
		cursor: pointer;
		box-shadow: 0 2px 10px rgba(66, 133, 244, 0.3);
	}
</style>