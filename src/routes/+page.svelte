<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth';
	import { browser } from '$app/environment';

	let authState = { isLoading: true, isAuthenticated: false, user: null };

	onMount(async () => {
		if (browser) {
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
			
			return unsubscribe;
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
