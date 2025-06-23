<script lang="ts">
	import { auth, isAuthenticated, user } from '$lib/auth';
	import { startNewChat } from '$lib/stores/chat';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	onMount(() => {
		const unsubscribe = isAuthenticated.subscribe(($isAuthenticated) => {
			if (!$isAuthenticated) {
				goto('/login');
			}
		});
		return unsubscribe;
	});

	function selectLevel(level: string) {
		startNewChat(level);
		goto(`/chat?level=${encodeURIComponent(level)}`);
	}

	function goToHistory() {
		goto('/history');
	}

	function logout() {
		auth.logout();
		goto('/login');
	}
</script>

<div class="main-screen">
	<div class="header">
		<button class="back-button" on:click={logout}>←</button>
		<h1 class="app-title">ECApp</h1>
	</div>
	<div class="content">
		{#if $user}
			<p class="welcome">Welcome, {$user.username}!</p>
		{/if}
		<p class="subtitle">さあ今日も<br />英会話を続けよう！</p>
		<div class="level-selection">
			<p>レベルを選択</p>
			<div class="level-buttons">
				<button class="level-button" on:click={() => selectLevel('初級者')}>初級者</button>
				<button class="level-button" on:click={() => selectLevel('中級者')}>中級者</button>
				<button class="level-button" on:click={() => selectLevel('上級者')}>上級者</button>
			</div>
		</div>
		<div class="topic-section">
			<p>英語で気になる話題を話かけてみよう</p>
			<div class="topic-buttons">
				<button class="topic-button" on:click={() => selectLevel('初級者')}>What do you say "Daihuku" in English?</button>
				<button class="topic-button" on:click={() => selectLevel('初級者')}>What do you say "Daihuku" in English?</button>
			</div>
		</div>
		<div class="message-input">
			<input type="text" placeholder="Type your messages ..." />
			<button class="send-button">→</button>
		</div>
		<button class="history-button" on:click={goToHistory}>Chat History</button>
	</div>
</div>

<style>
	.main-screen {
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
		margin-bottom: 30px;
		position: relative;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		margin-right: 20px;
	}

	.app-title {
		font-size: 36px;
		margin: 0;
		font-weight: bold;
		color: #333;
	}

	.welcome {
		font-size: 16px;
		color: #4285f4;
		margin: 10px 0;
		font-weight: 500;
	}

	.subtitle {
		font-size: 18px;
		margin: 20px 0;
		line-height: 1.4;
	}

	.level-selection {
		margin: 30px 0;
	}

	.level-buttons {
		display: flex;
		gap: 10px;
		margin-top: 10px;
	}

	.level-button {
		flex: 1;
		padding: 10px;
		background: #f0f0f0;
		border: none;
		border-radius: 20px;
		cursor: pointer;
	}

	.topic-section {
		margin: 30px 0;
	}

	.topic-buttons {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 10px;
	}

	.topic-button {
		padding: 15px;
		background: #e8f0fe;
		border: none;
		border-radius: 20px;
		text-align: left;
		cursor: pointer;
	}

	.message-input {
		display: flex;
		align-items: center;
		background: #f0f0f0;
		border-radius: 25px;
		padding: 5px;
		margin-top: 20px;
	}

	.message-input input {
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

	.history-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 25px;
		margin-top: 20px;
		cursor: pointer;
		width: 100%;
	}
</style>