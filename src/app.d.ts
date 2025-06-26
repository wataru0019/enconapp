// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { D1Database } from '$lib/db/database-d1.js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db?: D1Database;
			env?: {
				DB?: D1Database;
				JWT_SECRET?: string;
				ANTHROPIC_API_KEY?: string;
				[key: string]: any;
			};
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				DB?: D1Database;
				JWT_SECRET?: string;
				ANTHROPIC_API_KEY?: string;
				[key: string]: any;
			};
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
