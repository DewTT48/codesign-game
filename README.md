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

## Security

Only a Supabase publishable key is allowed in the browser build. Never add a
Supabase secret key or legacy service-role key to the repository or GitHub Pages
variables. Data access is protected by the RLS policies in `supabase/migrations`.
