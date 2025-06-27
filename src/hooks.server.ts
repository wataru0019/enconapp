// SvelteKit hooks for Cloudflare Workers integration
import type { Handle } from '@sveltejs/kit';
import { initializeD1Database, isCloudflareEnvironment } from '$lib/db/database-d1.js';

export const handle: Handle = async ({ event, resolve }) => {
  console.log('hooks.server.ts - handle called');
  console.log('isCloudflareEnvironment():', isCloudflareEnvironment());
  console.log('event.platform available:', !!event.platform);
  console.log('event.platform.env available:', !!event.platform?.env);
  console.log('event.platform.env.DB available:', !!event.platform?.env?.DB);
  
  // Initialize D1 database binding if in Cloudflare Workers environment
  if (isCloudflareEnvironment() && event.platform?.env?.DB) {
    try {
      console.log('Initializing D1 database...');
      initializeD1Database(event.platform.env.DB);
      console.log('D1 database binding initialized');
      
      // Initialize schema on first request
      console.log('Initializing D1 schema...');
      const { initializeD1Schema } = await import('$lib/db/database-d1.js');
      await initializeD1Schema();
      console.log('D1 schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize D1 database:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
    }
  } else {
    console.log('D1 initialization skipped - not Cloudflare environment or DB not available');
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