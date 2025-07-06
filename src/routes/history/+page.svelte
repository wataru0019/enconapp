<script lang="ts">
	import { chatHistory, loadChatHistory, loadChatSession } from '$lib/stores/chat';
	import { isAuthenticated, auth } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		const unsubscribe = isAuthenticated.subscribe(($isAuthenticated) => {
			if (!$isAuthenticated) {
				goto('/login');
			} else {
				// Load chat history when authenticated
				loadChatHistory();
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

	function logout() {
		auth.logout();
		goto('/login');
	}

	async function openChat(session: any) {
		// Load the specific chat session
		await loadChatSession(session.id);
		goto(`/chat?level=${encodeURIComponent(session.level)}`);
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getLevelName(level: string) {
		switch (level) {
			case 'beginner':
				return '初級者';
			case 'intermediate':
				return '中級者';
			case 'advanced':
				return '上級者';
			default:
				return level;
		}
	}
</script>

<div class="history-screen">
	<div class="header">
		<button class="back-button" on:click={goBack}>←</button>
		<h2>過去のチャット</h2>
		<div class="header-buttons">
			<button class="logout-button" on:click={logout}>ログアウト</button>
		</div>
	</div>
	<div class="history-list">
		{#if $chatHistory.length > 0}
			{#each $chatHistory as session}
				<button class="history-item" on:click={() => openChat(session)}>
					<div class="history-info">
						<span class="level">レベル：{getLevelName(session.level)}</span>
						<span class="topic">チャット：{session.topic || 'English Conversation'}</span>
						<span class="date">{formatDate(session.created_at)}</span>
					</div>
				</button>
			{/each}
		{:else}
			<div class="empty-state">
				<p>まだチャット履歴がありません。</p>
				<p>新しいチャットを始めましょう！</p>
			</div>
		{/if}
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

	.level, .topic, .date {
		font-size: 14px;
		color: #666;
	}

	.date {
		font-size: 12px;
		color: #999;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #666;
	}

	.empty-state p {
		margin: 10px 0;
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