# CODESIGN UI Review flow

UI Review is a checkpoint inside `PRD`, not a new CODESIGN phase. The mission map remains `C O D E S PRD I G N`.

## User flow

1. CODESIGN assembles a draft PRD from locked decisions.
2. CODESIGN creates a lean `CODESIGN UI BRIEF` for prototyping. Guided 21 Days projects include the locked product rules, experience direction, and one representative day—not the complete 21-day Content Pack.
3. The owner copies the prepared prompt into ChatGPT or another capable Chat.
4. Chat creates a visible prototype and iterates with the owner. It must wait for `FINALIZE UI REVIEW` before returning final Markdown.
5. The owner brings `CODESIGN_UI_REVIEW.md` and the exact approved HTML prototype back to CODESIGN.
6. CODESIGN hashes the raw HTML bytes with SHA-256 and requires an exact match with the filename/digest recorded in the UI Review. A mismatch blocks consolidation.
7. When the prototype changed an earlier decision, CODESIGN shows the accepted delta and asks only genuine unresolved owner questions inside PRD. The owner is never routed back through earlier phases.
8. Guided mode records the owner resolution and applies the approved review deterministically to `CODESIGN_HANDOFF.md` and `EXPERIENCE_DIRECTION.md`. `CONTENT_PACK.md` remains unchanged.
9. Guided mode creates a `Final PRD Change Summary` with the consolidation version and time, before/after fingerprints, changed-line counts, accepted changes, impact map, recorded owner answers, and Approved Prototype custody evidence.
10. The integrity gate verifies both updated files, every owner answer, the preserved `CONTENT_PACK.md`, and the byte-preserved Approved Prototype before Lock is enabled.
11. Build Your Own imports `CODESIGN_UI_REVIEW.md`, the approved HTML prototype, and a complete `PRODUCT_REQUIREMENTS.md`, then appends the same traceable prototype-change resolution.
12. The owner reviews the final handoff once and locks PRD.

## Guardrails

- A ready review requires the v1 marker, every required section, `Open Questions: NONE`, and the exact owner statement `I APPROVE THIS UI DIRECTION`.
- Prototype-driven changes use `OWNER CONFIRMATION NEEDED`. CODESIGN separates automatic consolidation work from genuine owner decisions, records the answers, and moves forward.
- `RE-PROTOTYPE REQUIRED` is reserved for a decision that makes the approved prototype invalid as a visual or interaction baseline.
- Legacy `REVISION REQUIRED — STEP E/S` review files are accepted as forward-confirmation checkpoints, so existing work is not stranded.
- Product rules, content, data behavior, and acceptance criteria come from the Final PRD. Covered layout and interaction come from the Approved Prototype when they do not conflict with the Final PRD. Prototype code is never copied directly as production code without reassessment.
- CODESIGN never executes uploaded prototype HTML in the main application DOM. The current implementation verifies and stores it without in-app execution.
- Approved prototype uploads are limited to 5 MB so the byte-preserved artifact remains safe to store and version with the PRD phase.
- The review is stored with PRD phase entries for auditability, while its approved conclusions are consolidated into the final handoff.
- Existing projects that completed UI Review before change evidence was introduced receive a deterministic evidence record on their next PRD-page load.
- The Codex build package contains five files: `CODESIGN_HANDOFF.md`, `CONTENT_PACK.md`, `EXPERIENCE_DIRECTION.md`, `APPROVED_PROTOTYPE.html`, and `START_WITH_CODEX.md`. Codex does not need a separate UI Review file because its conclusions and integrity reference are consolidated into the Final PRD.
- Codex must verify the prototype digest, compare the app screen-by-screen at mobile and desktop viewports, and create `PROTOTYPE_CONFORMANCE.md` before publishing. Material mismatches block publish.

## Persistence

The feature uses existing flexible `phase_entries` fields (`uiBriefDraft`, `uiReviewDraft`, `uiReviewResolution`, `uiReviewApplied`, `uiReviewChangeSummary`, and `approvedPrototypeArtifact`). The prototype is stored as byte-preserving base64 plus custody metadata, and the PRD phase lock versions it with the rest of the current phase entries. No new Supabase table or migration is required.
