// SvelteKit hooks for Cloudflare Workers integration
import type { Handle } from '@sveltejs/kit';
import { initializeD1Database, isCloudflareEnvironment } from '$lib/db/database-d1.js';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize D1 database binding if in Cloudflare Workers environment
  if (isCloudflareEnvironment() && event.platform?.env?.DB) {
    try {
      initializeD1Database(event.platform.env.DB);
    } catch (error) {
      console.error('Failed to initialize D1 database:', error);
    }
  }

  // Add database binding to locals for use in API routes
  if (event.platform?.env?.DB) {
    event.locals.db = event.platform.env.DB;
  }

  // Add environment variables to locals
  if (event.platform?.env) {
    event.locals.env = event.platform.env;
  }

  return resolve(event);
};