<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth';
	import { browser } from '$app/environment';

	let authState = { isLoading: true, isAuthenticated: false, user: null };

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
							goto('/login');
						}
					}
				});
				
				// Fallback - if auth takes too long, redirect to login
				setTimeout(() => {
					if (authState.isLoading) {
						goto('/login');
					}
				}, 2000);
				
				return unsubscribe;
			} catch (error) {
				console.error('Auth initialization failed:', error);
				goto('/login');
			}
		}
	});
</script>

{#if browser && authState.isLoading}
	<div class="loading">
		<p>Loading...</p>
	</div>
{/if}

<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style>
