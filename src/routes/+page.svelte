<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth';
	import { browser } from '$app/environment';

	let authState = { isLoading: true, isAuthenticated: false, user: null };
	let showLanding = false;

	onMount(async () => {
		if (browser) {
			try {
				await auth.initialize();
				
				const unsubscribe = auth.subscribe(($auth) => {
					authState = $auth;
					if (!$auth.isLoading) {
						if ($auth.isAuthenticated) {
							goto('/main');
						} else {
							showLanding = true;
						}
					}
				});
				
				// Fallback - if auth takes too long, show landing page
				setTimeout(() => {
					if (authState.isLoading) {
						showLanding = true;
					}
				}, 2000);
				
				return unsubscribe;
			} catch (error) {
				console.error('Auth initialization failed:', error);
				showLanding = true;
			}
		}
	});

	function goToLogin() {
		goto('/login');
	}
</script>

{#if browser && authState.isLoading && !showLanding}
	<div class="loading">
		<div class="spinner"></div>
		<p>Loading...</p>
	</div>
{:else if showLanding}
	<div class="landing-page">
		<div class="hero-section">
			<h1 class="app-title">EnconApp</h1>
			<p class="app-subtitle">AIと一緒に英会話を練習しよう</p>
			<div class="features">
				<div class="feature">
					<div class="feature-icon">💬</div>
					<h3>リアルタイムチャット</h3>
					<p>AIと自然な英会話ができます</p>
				</div>
				<div class="feature">
					<div class="feature-icon">📚</div>
					<h3>レベル別学習</h3>
					<p>初級から上級まで対応</p>
				</div>
				<div class="feature">
					<div class="feature-icon">📝</div>
					<h3>学習履歴</h3>
					<p>過去の会話を振り返りできます</p>
				</div>
			</div>
			<button class="cta-button" on:click={goToLogin}>始める</button>
		</div>
	</div>
{/if}

<style>
	.loading {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		gap: 20px;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #4285f4;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.landing-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		box-sizing: border-box;
	}

	.hero-section {
		background: white;
		border-radius: 20px;
		padding: 40px;
		max-width: 400px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	}

	.app-title {
		font-size: 36px;
		font-weight: bold;
		color: #333;
		margin: 0 0 10px 0;
	}

	.app-subtitle {
		font-size: 18px;
		color: #666;
		margin: 0 0 40px 0;
		line-height: 1.4;
	}

	.features {
		display: flex;
		flex-direction: column;
		gap: 30px;
		margin-bottom: 40px;
	}

	.feature {
		text-align: center;
	}

	.feature-icon {
		font-size: 48px;
		margin-bottom: 15px;
	}

	.feature h3 {
		font-size: 18px;
		color: #333;
		margin: 0 0 10px 0;
		font-weight: 600;
	}

	.feature p {
		font-size: 14px;
		color: #666;
		margin: 0;
		line-height: 1.5;
	}

	.cta-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 16px 40px;
		border-radius: 25px;
		font-size: 18px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
	}

	.cta-button:hover {
		background: #3367d6;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(66, 133, 244, 0.4);
	}
</style>
