import { writable } from 'svelte/store';

export const user = writable<{ username: string; isLoggedIn: boolean }>({
	username: '',
	isLoggedIn: false
});

export function login(username: string) {
	user.set({ username, isLoggedIn: true });
}

export function logout() {
	user.set({ username: '', isLoggedIn: false });
}