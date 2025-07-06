⏺ Implementation Plan for EnconApp Improvements

  Based on edit.md and codebase analysis, here's the prioritized
  implementation plan:

  Phase 1: Critical Bug Fixes (High Priority)

  1. Fix chat input keyboard overlap -
  src/routes/chat/+page.svelte:220-250
  2. Replace input with textarea for long text -
  src/routes/chat/+page.svelte:242
  3. Remove unnecessary components - src/routes/chat/+page.svelte:180-200
  4. Fix chat history display - src/routes/history/+page.svelte:15-25
  5. Add logout button - src/routes/+layout.svelte navigation
  6. Create landing page - src/routes/+page.svelte

  Phase 2: Feature Additions (Medium Priority)

  7. Japanese-to-English translation - New route + API endpoint
  8. Vocabulary notebook - New database table + UI components

  Phase 3: Advanced Features (Low Priority)

  9. Listening comprehension - Audio integration + TTS
  10. Speaking/pronunciation - Speech recognition + STT
  11. Video call functionality - WebRTC + AI vision

  Key Files to Modify

  - Chat UI: src/routes/chat/+page.svelte
  - History: src/routes/history/+page.svelte
  - Layout: src/routes/+layout.svelte
  - Database: src/lib/db/schema.sql
  - New API routes: src/routes/api/