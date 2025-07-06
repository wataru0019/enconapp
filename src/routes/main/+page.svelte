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