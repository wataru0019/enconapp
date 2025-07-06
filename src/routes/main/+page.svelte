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

	function goToTranslate() {
		goto('/translate');
	}

	function goToVocabulary() {
		goto('/vocabulary');
	}

	function logout() {
		auth.logout();
		goto('/login');
	}
</script>

<div class="main-screen">
	<div class="header">
		<h1 class="app-title">ECApp</h1>
		<button class="logout-button" on:click={logout}>ログアウト</button>
	</div>
	<div class="content">
		{#if $user}
			<p class="welcome">Welcome, {$user.username}!</p>
		{/if}
		<p class="subtitle">さあ今日も<br />英会話を続けよう！</p>
		<div class="level-selection">
			<p>レベルを選択</p>
			<div class="level-buttons">
				<button class="level-button" on:click={() => selectLevel('beginner')}>初級者</button>
				<button class="level-button" on:click={() => selectLevel('intermediate')}>中級者</button>
				<button class="level-button" on:click={() => selectLevel('advanced')}>上級者</button>
			</div>
		</div>
		<div class="feature-buttons">
			<button class="feature-button" on:click={goToHistory}>
				<div class="feature-icon">💬</div>
				<span>チャット履歴</span>
			</button>
			<button class="feature-button" on:click={goToTranslate}>
				<div class="feature-icon">🔄</div>
				<span>和英翻訳</span>
			</button>
			<button class="feature-button" on:click={goToVocabulary}>
				<div class="feature-icon">📚</div>
				<span>単語帳</span>
			</button>
		</div>
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
		justify-content: space-between;
		margin-bottom: 30px;
		position: relative;
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


	.feature-buttons {
		display: grid;
		grid-template-columns: 1fr;
		gap: 15px;
		margin-top: 30px;
	}

	.feature-button {
		background: white;
		border: 2px solid #4285f4;
		color: #4285f4;
		padding: 20px;
		border-radius: 15px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 15px;
		transition: all 0.3s ease;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.feature-button:hover {
		background: #4285f4;
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 10px rgba(66, 133, 244, 0.3);
	}

	.feature-icon {
		font-size: 24px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f8ff;
		border-radius: 10px;
	}

	.feature-button:hover .feature-icon {
		background: rgba(255, 255, 255, 0.2);
	}

	.feature-button span {
		font-size: 16px;
		font-weight: 600;
	}
</style>