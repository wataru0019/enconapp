<script lang="ts">
	import { isAuthenticated, auth } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getToken } from '$lib/auth';

	let vocabulary = [];
	let categories = [];
	let isLoading = false;
	let error = '';
	let selectedCategory = 'all';
	let searchQuery = '';
	let showAddModal = false;
	let editingWord = null;

	// New word form
	let newWord = {
		japaneseWord: '',
		englishTranslation: '',
		category: 'general',
		difficultyLevel: 'beginner',
		notes: ''
	};

	onMount(() => {
		const unsubscribe = isAuthenticated.subscribe(($isAuthenticated) => {
			if (!$isAuthenticated) {
				goto('/login');
			} else {
				loadVocabulary();
			}
		});
		return unsubscribe;
	});

	function goBack() {
		goto('/main');
	}

	function logout() {
		auth.logout();
		goto('/login');
	}

	async function loadVocabulary() {
		isLoading = true;
		error = '';

		try {
			const token = getToken();
			const params = new URLSearchParams();
			if (selectedCategory !== 'all') {
				params.append('category', selectedCategory);
			}
			if (searchQuery.trim()) {
				params.append('search', searchQuery.trim());
			}

			const response = await fetch(`/api/vocabulary?${params}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				vocabulary = data.vocabulary;
				categories = data.categories;
			} else {
				const errorData = await response.json();
				error = errorData.error || '単語帳の読み込みに失敗しました。';
			}
		} catch (err) {
			error = '接続エラーが発生しました。';
			console.error('Load vocabulary error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function saveWord() {
		if (!newWord.japaneseWord.trim() || !newWord.englishTranslation.trim()) {
			alert('日本語と英語の両方を入力してください。');
			return;
		}

		try {
			const token = getToken();
			const url = editingWord ? `/api/vocabulary/${editingWord.id}` : '/api/vocabulary';
			const method = editingWord ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(newWord)
			});

			if (response.ok) {
				closeModal();
				loadVocabulary();
			} else {
				const errorData = await response.json();
				alert(errorData.error || '単語の保存に失敗しました。');
			}
		} catch (err) {
			alert('エラーが発生しました。');
			console.error('Save word error:', err);
		}
	}

	async function deleteWord(word) {
		if (!confirm('この単語を削除しますか？')) return;

		try {
			const token = getToken();
			const response = await fetch(`/api/vocabulary/${word.id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			if (response.ok) {
				loadVocabulary();
			} else {
				const errorData = await response.json();
				alert(errorData.error || '単語の削除に失敗しました。');
			}
		} catch (err) {
			alert('エラーが発生しました。');
			console.error('Delete word error:', err);
		}
	}

	function openAddModal() {
		editingWord = null;
		newWord = {
			japaneseWord: '',
			englishTranslation: '',
			category: 'general',
			difficultyLevel: 'beginner',
			notes: ''
		};
		showAddModal = true;
	}

	function openEditModal(word) {
		editingWord = word;
		newWord = {
			japaneseWord: word.japanese_word,
			englishTranslation: word.english_translation,
			category: word.category,
			difficultyLevel: word.difficulty_level,
			notes: word.notes || ''
		};
		showAddModal = true;
	}

	function closeModal() {
		showAddModal = false;
		editingWord = null;
	}

	function handleSearch() {
		loadVocabulary();
	}

	function handleCategoryChange() {
		loadVocabulary();
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ja-JP');
	}

	function getLevelColor(level) {
		switch (level) {
			case 'beginner': return '#4caf50';
			case 'intermediate': return '#ff9800';
			case 'advanced': return '#f44336';
			default: return '#666';
		}
	}

	function getLevelText(level) {
		switch (level) {
			case 'beginner': return '初級';
			case 'intermediate': return '中級';
			case 'advanced': return '上級';
			default: return level;
		}
	}
</script>

<div class="vocabulary-screen">
	<div class="header">
		<button class="back-button" on:click={goBack}>←</button>
		<h2>単語帳</h2>
		<button class="logout-button" on:click={logout}>ログアウト</button>
	</div>

	<div class="controls">
		<div class="search-bar">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="単語を検索..."
				on:keypress={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<button class="search-button" on:click={handleSearch}>🔍</button>
		</div>

		<div class="filter-controls">
			<select bind:value={selectedCategory} on:change={handleCategoryChange}>
				<option value="all">すべてのカテゴリー</option>
				{#each categories as category}
					<option value={category}>{category}</option>
				{/each}
			</select>
			<button class="add-button" on:click={openAddModal}>+ 追加</button>
		</div>
	</div>

	{#if isLoading}
		<div class="loading">読み込み中...</div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else if vocabulary.length === 0}
		<div class="empty-state">
			<p>単語が見つかりませんでした。</p>
			<button class="add-button" on:click={openAddModal}>最初の単語を追加</button>
		</div>
	{:else}
		<div class="vocabulary-list">
			{#each vocabulary as word}
				<div class="word-card">
					<div class="word-header">
						<div class="word-main">
							<div class="japanese-word">{word.japanese_word}</div>
							<div class="english-translation">{word.english_translation}</div>
						</div>
						<div class="word-actions">
							<button class="edit-button" on:click={() => openEditModal(word)}>編集</button>
							<button class="delete-button" on:click={() => deleteWord(word)}>削除</button>
						</div>
					</div>
					<div class="word-details">
						<span class="category">{word.category}</span>
						<span class="level" style="color: {getLevelColor(word.difficulty_level)}">
							{getLevelText(word.difficulty_level)}
						</span>
						<span class="date">{formatDate(word.created_at)}</span>
					</div>
					{#if word.notes}
						<div class="notes">{word.notes}</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showAddModal}
	<div class="modal-overlay" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()} role="button" tabindex="0">
		<div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" tabindex="-1">
			<div class="modal-header">
				<h3>{editingWord ? '単語を編集' : '新しい単語を追加'}</h3>
				<button class="close-button" on:click={closeModal}>×</button>
			</div>
			<div class="modal-content">
				<div class="form-group">
					<label for="japanese-input">日本語</label>
					<input id="japanese-input" type="text" bind:value={newWord.japaneseWord} placeholder="例：こんにちは" />
				</div>
				<div class="form-group">
					<label for="english-input">英語</label>
					<input id="english-input" type="text" bind:value={newWord.englishTranslation} placeholder="例：Hello" />
				</div>
				<div class="form-group">
					<label for="category-input">カテゴリー</label>
					<input id="category-input" type="text" bind:value={newWord.category} placeholder="例：挨拶" />
				</div>
				<div class="form-group">
					<label for="level-select">レベル</label>
					<select id="level-select" bind:value={newWord.difficultyLevel}>
						<option value="beginner">初級</option>
						<option value="intermediate">中級</option>
						<option value="advanced">上級</option>
					</select>
				</div>
				<div class="form-group">
					<label for="notes-textarea">メモ</label>
					<textarea id="notes-textarea" bind:value={newWord.notes} placeholder="覚えるためのメモ..."></textarea>
				</div>
				<div class="modal-actions">
					<button class="cancel-button" on:click={closeModal}>キャンセル</button>
					<button class="save-button" on:click={saveWord}>保存</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.vocabulary-screen {
		min-height: 100vh;
		min-height: 100dvh;
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
		margin-bottom: 20px;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
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

	.controls {
		margin-bottom: 20px;
	}

	.search-bar {
		display: flex;
		gap: 10px;
		margin-bottom: 15px;
	}

	.search-bar input {
		flex: 1;
		padding: 10px;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 16px;
	}

	.search-button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 10px 15px;
		border-radius: 8px;
		cursor: pointer;
	}

	.filter-controls {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.filter-controls select {
		flex: 1;
		padding: 8px;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 14px;
	}

	.add-button {
		background: #2e7d32;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		white-space: nowrap;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: #666;
	}

	.error-message {
		background: #ffe6e6;
		color: #d32f2f;
		padding: 15px;
		border-radius: 10px;
		border-left: 4px solid #d32f2f;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #666;
	}

	.vocabulary-list {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.word-card {
		background: white;
		border: 1px solid #eee;
		border-radius: 10px;
		padding: 15px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.word-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 10px;
	}

	.word-main {
		flex: 1;
	}

	.japanese-word {
		font-size: 18px;
		font-weight: 600;
		color: #333;
		margin-bottom: 5px;
	}

	.english-translation {
		font-size: 16px;
		color: #4285f4;
	}

	.word-actions {
		display: flex;
		gap: 5px;
	}

	.edit-button, .delete-button {
		padding: 4px 8px;
		border: none;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
	}

	.edit-button {
		background: #4285f4;
		color: white;
	}

	.delete-button {
		background: #ff4444;
		color: white;
	}

	.word-details {
		display: flex;
		gap: 10px;
		font-size: 12px;
		color: #666;
		margin-bottom: 5px;
	}

	.category, .level, .date {
		background: #f5f5f5;
		padding: 2px 6px;
		border-radius: 3px;
	}

	.notes {
		font-size: 14px;
		color: #666;
		background: #f9f9f9;
		padding: 8px;
		border-radius: 5px;
		margin-top: 5px;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 10px;
		width: 90%;
		max-width: 400px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #eee;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 18px;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #666;
	}

	.modal-content {
		padding: 20px;
	}

	.form-group {
		margin-bottom: 15px;
	}

	.form-group label {
		display: block;
		margin-bottom: 5px;
		font-weight: 600;
		color: #333;
	}

	.form-group input, .form-group select, .form-group textarea {
		width: 100%;
		padding: 10px;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 16px;
		box-sizing: border-box;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 60px;
	}

	.modal-actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		margin-top: 20px;
	}

	.cancel-button {
		background: #666;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
	}

	.save-button {
		background: #2e7d32;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
	}
</style>