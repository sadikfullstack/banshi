Banshi Collector - Chrome extension (Manifest V3)

Install for development:

1. Open Chrome and go to `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select this repository folder.

Notes:
- Runs only on `instagram.com` pages via a content script.
- Collects visible profile data (followers, following, posts, handle, bio).
- Sends a POST to `window.location.origin + '/api/events'` every 60s with the required payload.
- Only stores `client_id` in `chrome.storage.local` and nothing else.
- The extension sets the toolbar badge to `ON` when the backend responds with success.

Migration & DB setup:
- Run the SQL migration in `sql/001_create_events_and_alerts.sql` in your Supabase project's SQL editor. This creates an `events` table and adds a `payload` column to `alerts` so snapshots are stored fully.
- Alternatively, run the SQL manually in psql as a DB admin.
- Provide `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` for server-side inserts to bypass RLS. Add this line to `.env.local` and restart Next:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Usage flow:
- Click the extension toolbar icon once to enable harvesting for the current browser and start an immediate snapshot. The extension will then run every 60 seconds automatically in the background.
- Click the extension icon again to disable periodic harvesting.

Notes:
- The extension stores two keys in `chrome.storage.local`: `banshi_client_id` and `banshi_api_base_url` and `banshi_enabled` (the enabled flag).
- The backend API now inserts raw snapshots into an `events` table and also creates an `alerts` row so the existing risk computation logic runs.

If you want the extension to post to a different backend, update the fetch URL in `content_scripts/profile_collector.js`.
