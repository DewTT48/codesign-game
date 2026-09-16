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

## Build Your Own v2

Phase 2 UI is protected by `VITE_BUILD_YOUR_OWN_V2=true`. The example env enables
it for local development. The dashboard then shows Project Pass inventory and a
link to `/projects/new/own`.

The hosted Supabase migrations must be applied before the application can read
or consume Project Passes, complete Own Journey steps, or review AI proposals.
The production build stays disabled unless the matching GitHub Actions variable
is explicitly set.

The Own Journey now covers C, O, D, E, S, PRD, I, G, and N with bilingual
content, required-answer gates, autosave, locked decision/evidence snapshots,
and read-only review of completed steps. CODESIGN AI supports the product-
definition flow through PRD with a server-selected GPT-5.6 Sol policy,
strict structured proposals, and Accept/Edit/Reject/Regenerate review. AI remains
disabled per Project until an Admin explicitly enables the bounded internal
allowance of five requests and a one-dollar hard cap.

## Security

Only a Supabase publishable key is allowed in the browser build. Never add a
Supabase secret key or legacy service-role key to the repository or GitHub Pages
variables. Data access is protected by the RLS policies in `supabase/migrations`.
