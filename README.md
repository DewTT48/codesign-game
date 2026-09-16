# CODESIGN

CODESIGN is a retro arcade-style learning workspace that guides a learner from an
idea to a solidified product definition, a Codex-ready PRD, and a tested web app.

Live application: https://dewtt48.github.io/codesign-game/

## Local development

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and
   publishable key when the hosted project is ready.
2. Run `npm install`.
3. Run `npm run dev`.

Use `npm run check` before publishing. The GitHub Pages workflow builds the Vite
application and publishes `dist` after every successful push to `main`.

## Build Your Own v2 preview

Phase 2 UI is protected by `VITE_BUILD_YOUR_OWN_V2=true`. The example env enables
it for local development. The dashboard then shows Project Pass inventory and a
link to `/projects/new/own`.

The Phase 1 migration must be applied to the local Supabase database before the
preview can read or consume Project Passes. No Stripe or OpenAI API is called by
this preview. The production build stays disabled unless the matching GitHub
Actions variable is explicitly set.

Phase 3A also includes a fail-closed AI usage foundation: typed proposal schemas,
server-selected GPT-5.6 Sol reasoning policy, and atomic budget/request ledgers.
The Edge Function intentionally returns `503 AI_NOT_CONFIGURED`; no API key,
live model call, or numeric allowance is enabled yet.

## Security

Only a Supabase publishable key is allowed in the browser build. Never add a
Supabase secret key or legacy service-role key to the repository or GitHub Pages
variables. Data access is protected by the RLS policies in `supabase/migrations`.
