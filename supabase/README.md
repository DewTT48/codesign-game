# CODESIGN Supabase

Database changes are versioned in `migrations/`. Apply them locally before linking
the repository to a hosted project. The browser application uses only the project
URL and publishable key. Never add a secret key or legacy service-role key to this
repository.

The RLS test creates two temporary users and verifies that project owners cannot
read or write one another's projects or child records.
