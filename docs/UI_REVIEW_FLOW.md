# CODESIGN UI Review flow

UI Review is a checkpoint inside `PRD`, not a new CODESIGN phase. The mission map remains `C O D E S PRD I G N`.

## User flow

1. CODESIGN assembles a draft PRD from locked decisions.
2. CODESIGN creates a lean `CODESIGN UI BRIEF` for prototyping. Guided 21 Days projects include the locked product rules, experience direction, and one representative day—not the complete 21-day Content Pack.
3. The owner copies the prepared prompt into ChatGPT or another capable Chat.
4. Chat creates a visible prototype and iterates with the owner. It must wait for `FINALIZE UI REVIEW` before returning final Markdown.
5. The owner brings `CODESIGN_UI_REVIEW.md` back to CODESIGN.
6. Guided mode applies the approved review deterministically to `CODESIGN_HANDOFF.md` and `EXPERIENCE_DIRECTION.md`. `CONTENT_PACK.md` remains unchanged.
7. Build Your Own imports both `CODESIGN_UI_REVIEW.md` and a complete `PRODUCT_REQUIREMENTS.md` updated by Chat from the approved review.
8. The owner reviews the final handoff once and locks PRD.

## Guardrails

- An approved review requires the v1 marker, every required section, `Open Questions: NONE`, and the exact owner statement `I APPROVE THIS UI DIRECTION`.
- A UI request that changes product scope or rules must return `REVISION REQUIRED — STEP E` or `REVISION REQUIRED — STEP S`.
- Prototype code is never a source of truth.
- The review is stored with PRD phase entries for auditability, while its approved conclusions are consolidated into the final handoff.
- The Codex build package remains four files: `CODESIGN_HANDOFF.md`, `CONTENT_PACK.md`, `EXPERIENCE_DIRECTION.md`, and `START_WITH_CODEX.md`. Codex does not need a fifth UI Review file.

## Persistence

The feature uses existing `phase_entries` fields (`uiBriefDraft`, `uiReviewDraft`, and `uiReviewApplied`). No new Supabase table or migration is required.
