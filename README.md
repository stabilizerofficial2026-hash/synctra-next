# SyncTrA Next — clean mobile-first rebuild package

This is a cleaned frontend package based on the supplied `synctra-reference-rebuild.zip`.

## Preserved
- Existing Supabase project connection and publishable browser key in `app.js`
- Existing authentication, profile, membership gate, feed, reactions, comments, follows
- Private messages, Open Minds rooms, community chat, notifications and moderation
- Existing artwork and room assets
- Existing HTML element IDs and JavaScript event wiring

## Visual layer
`styles-next.css` is loaded after the existing stylesheet. It adds a mobile-first emerald / obsidian visual layer, improves touch targets, sticky navigation, form sizing, room controls, and narrow-screen spacing. Existing app logic is not rewritten.

## Supabase
The frontend remains configured for the existing SyncTrA project:
- Project ref: `pbhuxeuwyhmdemvtsshy`
- Region: `ap-southeast-1` (Singapore)

No database reset or schema migration is included. Do not run the archived SQL scripts automatically; they are retained under `supabase/reference-migrations/` for reference only.

## Important billing status
The supplied source describes membership plans, but the previous project notes state checkout is not yet connected to a verified payment gateway/webhook. Do not enable paid checkout or advertise payment as operational until the server-side payment flow is implemented and tested.

## Deploy
1. Upload the contents of this folder to a new GitHub repository root.
2. Connect that repository to Cloudflare Pages.
3. Build command: leave blank for this static HTML project.
4. Output directory: `/` (repository root).
5. Verify Supabase Auth redirect URLs and site URL include the deployed domain.
6. Test on Android at 320px, 360px, 390px, and 430px widths.

## Verification performed
- Package rebuilt from the uploaded ZIP.
- Removed phase-by-phase duplicate documentation and stray placeholder files.
- Kept source SQL files for reference without executing them.
- `app.js` should be checked with `node --check` before production deployment.
- No authenticated live-browser test or live payment test is claimed by this package.
