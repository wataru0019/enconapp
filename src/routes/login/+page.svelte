<script lang="ts">
	import { auth } from '$lib/auth';
	import { goto } from '$app/navigation';
	
	let username = '';
	let password = '';
	let isLoading = false;
	let error = '';
	let isRegisterMode = false;

	async function handleLogin() {
		if (!username || !password) return;
		
		isLoading = true;
		error = '';
		
		try {
			const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			
			const data = await response.json();
			
			if (response.ok) {
				auth.login(data.token, data.user);
				goto('/main');
			} else {
				error = data.error;
			}
		} catch (err) {
			error = 'Network error. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function toggleMode() {
		isRegisterMode = !isRegisterMode;
		error = '';
	}
</script>

<div class="login-screen">
	<h1 class="app-title">ECApp</h1>
	
	{#if error}
		<div class="error-message">{error}</div>
	{/if}
	
	<div class="form-group">
		<label>Username</label>
		<input type="text" bind:value={username} placeholder="Enter username" disabled={isLoading} />
	</div>
	<div class="form-group">
		<label>Password</label>
		<input type="password" bind:value={password} placeholder="Enter password" disabled={isLoading} />
	</div>
	
	<button class="login-button" on:click={handleLogin} disabled={isLoading || !username || !password}>
		{#if isLoading}
			Loading...
		{:else}
			{isRegisterMode ? 'Register' : 'Login'}
		{/if}
	</button>
	
	<a href="#" class="toggle-mode" on:click|preventDefault={toggleMode}>
		{isRegisterMode ? 'Already have an account? Login' : 'Need an account? Register'}
	</a>
</div>

<style>
	.login-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 100vh;
		padding: 20px;
		box-sizing: border-box;
		max-width: 400px;
		margin: 0 auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.app-title {
		font-size: 48px;
		font-weight: bold;
		margin-bottom: 40px;
		color: #333;
	}

	.form-group {
		width: 100%;
		max-width: 300px;
		margin-bottom: 20px;
		text-align: left;
	}

	.form-group label {
		display: block;
		margin-bottom: 5px;
		font-weight: 500;
	}

	.form-group input {
		width: 100%;
		padding: 12px;
		border: 2px solid #ddd;
		border-radius: 25px;
		font-size: 16px;
		box-sizing: border-box;
	}

	.error-message {
		background: #fee;
		color: #c33;
		padding: 10px;
		border-radius: 5px;
		margin-bottom: 20px;
		width: 100%;
		max-width: 300px;
		text-align: center;
		font-size: 14px;
	}

	.login-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 12px 40px;
		border-radius: 25px;
		font-size: 16px;
		cursor: pointer;
		margin-bottom: 20px;
	}

	.login-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.toggle-mode {
		color: #4285f4;
		text-decoration: none;
		font-size: 14px;
	}

	.toggle-mode:hover {
		text-decoration: underline;
	}
</style>