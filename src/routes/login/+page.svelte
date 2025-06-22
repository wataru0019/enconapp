<script lang="ts">
	import { login } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	
	let username = '';
	let password = '';

	function handleLogin() {
		if (username && password) {
			login(username);
			goto('/main');
		}
	}
</script>

<div class="login-screen">
	<h1 class="app-title">ECApp</h1>
	<div class="form-group">
		<label>Username</label>
		<input type="text" bind:value={username} placeholder="placeholder..." />
	</div>
	<div class="form-group">
		<label>Password</label>
		<input type="password" bind:value={password} placeholder="placeholder..." />
	</div>
	<a href="#" class="forgot-password">forget password...</a>
	<button class="login-button" on:click={handleLogin}>Button</button>
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

	.forgot-password {
		color: #666;
		text-decoration: none;
		font-size: 14px;
		margin-bottom: 30px;
	}

	.login-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 12px 40px;
		border-radius: 25px;
		font-size: 16px;
		cursor: pointer;
	}
</style>