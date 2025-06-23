import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
	id: number;
	username: string;
}

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		login: (token: string, user: User) => {
			if (browser) {
				localStorage.setItem('auth_token', token);
			}
			set({
				user,
				isAuthenticated: true,
				isLoading: false
			});
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('auth_token');
			}
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false
			});
		},
		initialize: async () => {
			if (browser) {
				const token = localStorage.getItem('auth_token');
				if (token && token.trim() !== '') {
					try {
						const response = await fetch('/api/auth/verify', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ token })
						});
						
						if (response.ok) {
							const data = await response.json();
							set({
								user: data.user,
								isAuthenticated: true,
								isLoading: false
							});
							return;
						} else {
							localStorage.removeItem('auth_token');
						}
					} catch (error) {
						console.error('Token verification failed:', error);
						localStorage.removeItem('auth_token');
					}
				}
			}
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false
			});
		},
		setLoading: (loading: boolean) => {
			update(state => ({ ...state, isLoading: loading }));
		}
	};
}

export const auth = createAuthStore();

export const user = derived(auth, $auth => $auth.user);
export const isAuthenticated = derived(auth, $auth => $auth.isAuthenticated);
export const isLoading = derived(auth, $auth => $auth.isLoading);

export function getToken(): string | null {
	if (browser) {
		return localStorage.getItem('auth_token');
	}
	return null;
}