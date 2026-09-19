# CODESIGN UI Review flow

UI Review is a checkpoint inside `PRD`, not a new CODESIGN phase. The mission map remains `C O D E S PRD I G N`.

## User flow

1. CODESIGN assembles a draft PRD from locked decisions.
2. CODESIGN creates a lean `CODESIGN UI BRIEF` for prototyping. Guided 21 Days projects include the locked product rules, experience direction, and one representative day—not the complete 21-day Content Pack.
3. The owner copies the prepared prompt into ChatGPT or another capable Chat.
4. Chat creates a visible prototype and iterates with the owner. It must wait for `FINALIZE UI REVIEW` before returning final Markdown.
5. The owner brings `CODESIGN_UI_REVIEW.md` back to CODESIGN.
6. When the prototype changed an earlier decision, CODESIGN shows the accepted delta and asks only genuine unresolved owner questions inside PRD. The owner is never routed back through earlier phases.
7. Guided mode records the owner resolution and applies the approved review deterministically to `CODESIGN_HANDOFF.md` and `EXPERIENCE_DIRECTION.md`. `CONTENT_PACK.md` remains unchanged.
8. Guided mode creates a `Final PRD Change Summary` with the consolidation version and time, before/after fingerprints, changed-line counts, accepted changes, impact map, and recorded owner answers.
9. The integrity gate verifies that both updated files contain the approved UI Review, every owner answer is present, and `CONTENT_PACK.md` still matches its pre-prototype fingerprint before Lock is enabled.
10. Build Your Own imports both `CODESIGN_UI_REVIEW.md` and a complete `PRODUCT_REQUIREMENTS.md`, then appends the same traceable prototype-change resolution.
11. The owner reviews the final handoff once and locks PRD.

## Guardrails

- A ready review requires the v1 marker, every required section, `Open Questions: NONE`, and the exact owner statement `I APPROVE THIS UI DIRECTION`.
- Prototype-driven changes use `OWNER CONFIRMATION NEEDED`. CODESIGN separates automatic consolidation work from genuine owner decisions, records the answers, and moves forward.
- `RE-PROTOTYPE REQUIRED` is reserved for a decision that makes the approved prototype invalid as a visual or interaction baseline.
- Legacy `REVISION REQUIRED — STEP E/S` review files are accepted as forward-confirmation checkpoints, so existing work is not stranded.
- Prototype code is never a source of truth.
- The review is stored with PRD phase entries for auditability, while its approved conclusions are consolidated into the final handoff.
- Existing projects that completed UI Review before change evidence was introduced receive a deterministic evidence record on their next PRD-page load.
- The Codex build package remains four files: `CODESIGN_HANDOFF.md`, `CONTENT_PACK.md`, `EXPERIENCE_DIRECTION.md`, and `START_WITH_CODEX.md`. Codex does not need a fifth UI Review file.

## Persistence

The feature uses existing flexible `phase_entries` fields (`uiBriefDraft`, `uiReviewDraft`, `uiReviewResolution`, `uiReviewApplied`, and `uiReviewChangeSummary`). No new Supabase table or migration is required.
