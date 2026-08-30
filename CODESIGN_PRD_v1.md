# CODESIGN — Product Requirements Document (PRD) v1.0

**Status:** Ready for Codex implementation planning  
**Primary launch experience:** Build with Guide  
**Core learning outcome:** Turn an idea into a solidified Product Definition / PRD before handing it to Codex to build.  
**Guided build case:** `21 DAYS OF ______`  

---

## 1. Product Summary

CODESIGN is a retro arcade-style learning workspace that teaches people how to work with Chat and Codex to create a real web product.

The platform does **not** embed AI. Instead, it guides the learner through a structured product-thinking process, sends them out to use their real Chat conversation, records the decisions they bring back, solidifies those decisions into a PRD, and then guides the handoff to Codex.

The core framework is:

**C — Context**  
**O — Options**  
**D — Debate**  
**E — Establish**  
**S — Specify**  
**I — Implement**  
**G — Get Feedback**  
**N — Next Iteration**

The first learning mode is **Build with Guide**. Learners build one complete standalone web app during the class using the shared structure:

> **21 DAYS OF ______**

The learner chooses the topic. Examples might include Writing, Exercise, Drawing, Meditation, Wealth, Learning, or any other topic. The topic and content are the learner's responsibility: they may arrive with the content ready, create it during class, or use Chat to help create it.

The fixed constraint is only the **21-day product structure**. The learner's content, product decisions, visual direction, and final app are their own.

The learner should leave the class with:

1. A working web app deployed to a public URL.
2. A CODESIGN Journal showing how the product evolved.
3. A Codex-ready PRD that documents the product definition.

---

## 2. Product Thesis

> **You do not need the perfect first prompt. You need a process that turns uncertainty into decisions.**

CODESIGN teaches learners not to jump directly from an idea to code.

The learning journey is:

**IDEA → UNDERSTOOD → EXPLORED → DECIDED → SOLID → BUILD READY → PRODUCT**

The system must make this progression visible throughout the experience.

The progress indicator is **not a quality score**. It does not claim that the learner's decisions are correct. It only shows that the required product-definition work has been captured and intentionally locked.

---

## 3. Core Learning Objective

By the end of Build with Guide, a learner should be able to:

- start from a vague product idea;
- use Chat to clarify the problem and user context;
- ask for multiple options before choosing a solution;
- identify and challenge AI assumptions;
- deliberately lock product decisions and scope;
- specify the behavior, data, content structure, visual character, and acceptance criteria of a product;
- turn those decisions into a PRD;
- hand the PRD to Codex rather than asking Codex to invent the product;
- test the resulting app against the intended behavior;
- prioritize a next iteration based on observed feedback.

---

## 4. Product Modes

### 4.1 Build with Guide — Launch-Critical

Purpose: teach CODESIGN through a guided hands-on build.

The learner builds:

> **21 DAYS OF ______**

They choose the topic themselves.

The platform provides the learning sequence, questions, hints, gates, journal structure, progress states, and PRD assembly.

### 4.2 Build on Your Own — Phase 2

Purpose: apply the same CODESIGN method to any product after the learner understands the framework.

This mode should reuse the same Journey Engine, Journal Engine, decision history, PRD generation, and progress model, but remove the fixed 21-day constraint and reduce guidance.

**Important:** The detailed prompts/gates for Build on Your Own are not yet solidified. Codex must not invent this mode in v1. The v1 UI may show it as locked/coming next after Guided completion.

---

## 5. Basic vs Advanced Learning Scope

CODESIGN itself is a cloud-backed product with Auth and Database.

However, the **web app that the learner builds in the Basic guided course** must follow these technical boundaries:

- standalone web app;
- no authentication;
- no cloud database;
- no backend;
- no required paid/external API;
- browser-based state/persistence is allowed, e.g. localStorage;
- mobile-friendly;
- deployable/shareable through GitHub Pages.

These constraints teach the learner to create a complete product before adding cloud architecture.

A future Advanced course may teach Auth, Database, permissions, cloud services, and multi-user architecture.

---

## 6. Authentication Model for CODESIGN

Authentication must **not** block the public landing experience.

### Public flow

1. LANDING
2. Choose `BUILD WITH GUIDE`
3. Read mission brief and understand the experience
4. Press `START BUILDING`
5. **AUTH GATE**
6. Sign in / create account
7. Create a guided project in the database
8. Enter C — Context

### Auth requirement

Auth happens **when the learner is about to enter the actual creation process**, not when they first visit the site.

Reason: from C onward, the learner is creating valuable project data that must be saved: context, options, assumptions, decisions, PRD, journal, feedback, and build URL.

### Recommended v1 auth implementation

- Supabase Auth
- Google OAuth and/or email magic link
- Persistent session
- Sign out
- Account data private by default

Exact provider configuration is an implementation decision, not a learning concept.

---

## 7. Project Setup

After authentication, create a Guided project.

### Screen: CREATE YOUR GUIDED PROJECT

Primary field:

**21 DAYS OF**

`______________________________`

Helper examples may include:

`Writing · Exercise · Drawing · Meditation · Wealth · Learning · Anything`

Do not imply that the learner has 21 days to build the app. The app is built during the class. The 21 days are the structure of the app being created.

Secondary question:

**How ready is your content right now?**

- `I HAVE IT READY`
- `I HAVE SOME`
- `I ONLY HAVE AN IDEA`

This is informational only. There is no wrong answer and it must not block starting CODESIGN.

Save this state in the project journal.

---

## 8. Mission Map

Show the CODESIGN path as a game map.

At project start:

- C unlocked
- O, D, E, S, I, G, N locked

Suggested visual:

`C → O → D → E → S → PRD → I → G → N`

Each phase unlocks only after its required capture/review/lock gate is completed.

No score or leaderboard is required.

---

## 9. Product Definition / Solidification Meter

The game must continuously show the maturity of the product definition.

### Stages

1. **IDEA** — project created
2. **UNDERSTOOD** — C locked
3. **EXPLORED** — O and D completed
4. **DECIDED** — E locked
5. **SOLID** — S completed
6. **BUILD READY** — PRD Gate passed

Suggested display:

`IDEA → UNDERSTOOD → EXPLORED → DECIDED → SOLID → BUILD READY`

A horizontal arcade-style meter may accompany the labels.

### Critical meaning

Always communicate:

> **Progress reflects completed product-definition work, not whether the learner's decisions are correct.**

The meter is based on required entries and lock states, not semantic correctness.

### Entry states

Structured fields should support:

- EMPTY
- CAPTURED
- LOCKED

Meaningful progress should occur primarily when a phase has been reviewed and intentionally locked, not merely when a character is typed into a field.

---

## 10. Core Gameplay Loop

Most CODESIGN phases should follow the same repeatable loop:

1. **MISSION** — what are we trying to accomplish now?
2. **WHY IT MATTERS** — one concise principle
3. **THINK FIRST** — human/team thinks before Chat
4. **TALK TO CHAT** — use the learner's real Chat conversation
5. **CAPTURE** — record only the important result back in CODESIGN
6. **CHALLENGE / REVIEW** — question what has been captured
7. **LOCK** — human intentionally commits
8. **SOLIDIFICATION UPDATE** — progress / unlock feedback

The repetition is intentional: learners should internalize the working pattern, not memorize prompt templates.

---

## 11. Guidance System

Because CODESIGN does not judge semantic correctness, the quality of its guidance is central to the product.

Use a layered help system.

### Layer 1 — GUIDELINE

Always visible, concise principle explaining what to think about.

Example for C:

> อย่าเพิ่งคิดว่า App ต้องมีอะไร ทำให้ชัดก่อนว่าใครจะใช้ และเพื่ออะไร

### Layer 2 — THINKING HINT

Button: `NEED A HINT?`

Expands questions that help the learner think, without providing the product answer.

### Layer 3 — CHAT MOVE

Button: `HOW CAN I ASK CHAT?`

Shows a possible conversational move, not a mandatory copy/paste prompt.

Example:

> “ยังไม่ต้องออกแบบ App ช่วยถามคำถามเพื่อทำความเข้าใจ User, Goal, Context และ Constraints ของสิ่งที่ผมกำลังสร้างก่อน”

### Optional Layer 4 — EXAMPLE

Use sparingly when a concept is difficult to visualize.

Every example must be labeled:

> **Example — not a recommended answer**

The product must not train learners to believe there is one correct template.

---

# 12. C — CONTEXT

## Learning intention

Make the learner and Chat share the same mental model before designing a solution.

## Opening

**C — CONTEXT**  
**DON'T DESIGN YET.**

> ก่อนคิดว่า App จะมี Feature อะไร ทำให้ชัดก่อนว่าคุณกำลังสร้างมันให้ใครและเพื่ออะไร

## Think First

Use the project topic from setup.

Capture short initial human thinking:

- Who do you want this app to help?
- What do you want to happen for them after the 21-day experience?

## Chat Mission

Ask the learner to continue in a real Chat conversation.

Goal: establish:

- WHO
- GOAL / WHY
- SUCCESS
- CONTEXT OF USE
- CONSTRAINTS

Instruction:

> ยังไม่ต้องให้ Chat ออกแบบ App

## Capture fields

- `WHO IS THIS FOR?`
- `WHAT DO THEY WANT TO ACHIEVE?`
- `SUCCESS LOOKS LIKE...`
- `IMPORTANT CONTEXT`
- `CONSTRAINTS`

## Reflection

`WHAT DID CHAT CHANGE?`

Multi-select:

- It made my idea clearer
- It found something I had not considered
- I had to correct Chat
- My thinking did not change much

Optional text:

`WHAT DID YOU CORRECT OR CHANGE?`

## Review gate

Show a summary card of the captured context.

Ask:

> ถ้ามีคนอื่นอ่านแค่นี้ เขาจะเข้าใจไหมว่าเรากำลังสร้างอะไร เพื่อใคร และเพื่ออะไร?

Actions:

- `NOT YET — EDIT`
- `YES — LOCK CONTEXT`

## Completion

State becomes **UNDERSTOOD**.

Message:

> **CONTEXT LOCKED**  
> AI can help you think. You decide what becomes true.

---

# 13. O — OPTIONS

## Learning intention

Use AI to expand possibilities before committing to a solution.

## Opening

**O — OPTIONS**  
**DON'T FALL IN LOVE WITH THE FIRST IDEA.**

> Problem เดียวสามารถกลายเป็น Product ได้หลายแบบ

## Chat Mission

Using the locked Context, ask Chat for at least **3 meaningfully different product directions** and the trade-offs of each.

## Capture

Require at least 3 option cards.

Each card:

- Option name
- Core idea
- What we like
- Trade-off

## Human review

Ask:

> ตัวเลือกไหนเหมาะกับ Context ที่ Lock ไว้ที่สุด ไม่ใช่แค่ตัวเลือกที่ดูน่าสนใจที่สุด?

Allow learner to mark:

`CURRENT FAVORITE`

This is **not yet a locked product decision**.

## Completion

O is completed, but **EXPLORED** is not fully reached until Debate is also complete.

---

# 14. D — DEBATE

## Learning intention

Teach the learner to challenge AI assumptions rather than accepting plausible suggestions because they sound confident.

## Opening

**D — DEBATE**  
**AI SOUNDS CONFIDENT. THAT DOESN'T MAKE IT RIGHT.**

Display the current favorite from O.

## Chat Mission 1 — Expose assumptions

Ask the learner to return to the same Chat conversation and ask what assumptions are embedded in the proposed direction.

## Capture

Require at least 2:

`AI ASSUMED THAT...`

1. ______
2. ______
3. optional

## Challenge Round

For each selected assumption, allow:

- `WE AGREE`
- `WE CHALLENGE`

If challenged, require:

- `WHY?`
- `WHAT SHOULD CHANGE?`

## Chat Mission 2 — Reconsider

Ask the learner to challenge the proposal in Chat using the locked Context and return with the updated thinking.

## Reflection

Choose:

- `OUR DIRECTION STAYED THE SAME`
- `WE CHANGED OUR DIRECTION`

Then capture:

`WHAT CHANGED AND WHY?`

## Journal behavior

Preserve:

- original AI suggestion / direction;
- assumption challenged;
- human rationale;
- resulting change.

Do not overwrite the earlier state.

## Completion

After O + D are complete, state becomes **EXPLORED**.

---

# 15. E — ESTABLISH

## Learning intention

Stop exploration and deliberately define the scope of this version.

## Opening

**E — ESTABLISH**  
**EXPLORATION ENDS HERE.**

> ถึงเวลาหยุดเพิ่ม Option และตัดสินใจว่า Version นี้จะเป็นอะไร

## Decision Board

### WE ARE BUILDING

One concise product direction statement.

### MUST HAVE

Core requirements/features for this version.

Recommended UI limit: approximately 6–8 items to encourage scope discipline.

### NOT IN THIS VERSION

Require at least 2 non-goals.

## Locked Basic Build Rules

Display as non-editable course constraints:

- Standalone Web App
- Browser-based persistence allowed
- No Auth in the learner-built app
- No Cloud Database in the learner-built app
- No Backend
- No required paid/external service
- GitHub Pages deployable

## Decision principle

> If Chat suggests a new feature after this point, it is not automatically added. It must become a deliberate product decision first.

## Lock gate

Action:

`LOCK PRODUCT SCOPE`

## Completion

State becomes **DECIDED**.

Message:

> **SCOPE LOCKED**  
> More features ≠ better product.

---

# 16. S — SPECIFY

S is the largest chapter. It turns product decisions into a buildable specification.

Use multiple mini-missions rather than a single long form.

## S1 — EXPERIENCE FLOW

Question:

> ผู้ใช้เปิด App แล้วเกิดอะไรขึ้นตั้งแต่ต้นจนจบ?

Allow learner to create an ordered flow such as:

`START → STEP → STEP → RESULT`

Interaction may be add / delete / reorder cards. Do not require drag-only behavior; always provide accessible move controls.

Required output: primary user flow.

---

## S2 — SCREENS & BEHAVIOR

For each major screen/state capture:

- `SCREEN NAME`
- `USER SEES`
- `USER CAN DO`
- `WHAT HAPPENS NEXT`

Goal: translate abstract features into observable behavior.

Do not force a predefined number of screens.

---

## S3 — CONTENT & DATA

### Content readiness check

Ask:

- `READY`
- `PARTLY READY`
- `NEED TO CREATE`

If content is not ready, guidance should state that the learner may:

- use content prepared before class;
- create it during class;
- use Chat to help create it.

CODESIGN does not judge the source of the content.

### 21-Day content gate

Before S is complete, the product must have the content/data needed for implementation.

Do **not** force all products to use the same Day schema.

Ask:

> **หนึ่ง Day ใน Product ของคุณประกอบด้วยอะไรบ้าง?**

Allow the learner to define fields such as, but not limited to:

- Day Number
- Title
- Lesson
- Activity
- Reflection
- Prompt
- Checklist
- Media reference

The user defines the structure.

### Data/state thinking

Ask what the app needs to remember in the browser, for example:

- current/progress state;
- completed days;
- learner entries/reflections;
- settings;
- reset state.

Do not teach cloud database concepts in Basic.

---

## S4 — CHARACTER & VISUAL DIRECTION

## Learning intention

Teach that visual character is a product decision, not decoration that should be delegated blindly to Codex.

### Character

Ask:

> **HOW SHOULD YOUR PRODUCT FEEL?**

Allow learner to choose up to 3 words from examples plus Custom:

- Calm
- Playful
- Energetic
- Focused
- Warm
- Bold
- Professional
- Minimal
- Reflective
- Motivating
- Custom

### Visual direction

Capture:

- visual style / character;
- primary color role;
- accent color role;
- background;
- surface;
- desired interaction tone;
- optional typography direction.

### Rationale

Require:

`THIS FITS MY USER BECAUSE...`

The point is to connect visual choices to user/purpose, not personal taste alone.

---

## S5 — EDGE CASES & ACCEPTANCE

Prompt the learner to make explicit decisions that Codex would otherwise have to guess.

Suggested scenarios:

- Browser closes and reopens — what must persist?
- Can users revisit an earlier day?
- Can users skip ahead?
- What happens if required text is empty?
- Can a completed day be edited?
- Can progress be reset?
- What exactly should Reset remove?
- What happens on mobile / narrow screens?

The platform supplies questions but does not prescribe answers.

### Acceptance Criteria

Section:

`IT IS DONE WHEN...`

Require approximately 5–8 plain-language acceptance criteria.

Examples of form only:

- User can...
- App remembers...
- App works on mobile...

Do not grade semantic correctness.

## S completion

When S1–S5 required fields/gates are complete, state becomes **SOLID**.

---

# 17. PRD GATE

The PRD Gate is a major transition moment.

## Screen

**PRODUCT DEFINITION: SOLID**

Checklist:

- CONTEXT ✓
- OPTIONS EXPLORED ✓
- ASSUMPTIONS CHALLENGED ✓
- SCOPE LOCKED ✓
- FLOW DEFINED ✓
- CONTENT READY ✓
- EXPERIENCE DEFINED ✓
- ACCEPTANCE CRITERIA ✓

## Critical review question

> **มีอะไรใน Specification นี้ที่ AI เติมเข้ามาเอง โดยที่คุณไม่เคยตัดสินใจหรือไม่?**

Actions:

- `YES — REVIEW`
- `NO — READY`

If Ready:

**PRD SOLIDIFIED**  
**HANDOFF READY**

State becomes **BUILD READY**.

---

# 18. PRD Generation

Generate the PRD from structured CODESIGN records, not by asking an embedded AI to invent or summarize missing product decisions.

The user must be able to review/edit the assembled PRD before final lock/export.

## PRD structure

1. Product Name
2. Product Summary / Purpose
3. User
4. Goal / Success
5. Context & Constraints
6. Product Direction
7. Scope / Must Have
8. Non-Goals
9. Primary User Flow
10. Screens & Behaviors
11. Content Structure
12. Data / Browser State
13. Visual Character & Design Direction
14. Edge Cases / Product Rules
15. Responsive / Accessibility Requirements
16. Acceptance Criteria
17. Basic Technical Constraints
18. Handoff Instructions for Codex

## Basic technical constraints in generated PRD

Always include:

- Build a standalone web app.
- No backend.
- No authentication.
- No cloud database.
- No required paid/external API.
- Browser/localStorage persistence may be used where needed.
- Must be mobile-friendly.
- Must be deployable to GitHub Pages.

## Codex handoff instruction

Include a short instruction such as:

> Implement this PRD faithfully. Do not add important product features or behaviors that are not defined here. You may make reasonable implementation-level decisions. If an ambiguity would materially change product behavior, flag it as `PRODUCT DECISION REQUIRED` instead of silently inventing a product rule.

## Export

MVP:

- Download PRD as Markdown `.md`
- Copy PRD
- Print-friendly view / browser Save as PDF

---

# 19. I — IMPLEMENT

## Learning intention

Teach the role transition from product definition to implementation.

## Opening

**I — IMPLEMENT**  
**YOU KNOW WHAT TO BUILD. NOW LET CODEX BUILD IT.**

## Guide sequence

1. Open/create project in Codex.
2. Give Codex the exported PRD.
3. Ask Codex to build the complete Basic version.
4. Preview/run the app.
5. Fix implementation issues without silently changing product decisions.
6. Deploy to GitHub Pages.

## Core rule

> **CODEX MAY MAKE IMPLEMENTATION DECISIONS.**  
> **CODEX SHOULD NOT INVENT IMPORTANT PRODUCT DECISIONS.**

If Codex asks or encounters an ambiguous product rule, the learner should return to the product decision, update the PRD if necessary, and continue.

## Completion fields

- `I HAVE A WORKING APP`
- App URL
- Optional repository URL

Save to project record / journal.

---

# 20. G — GET FEEDBACK

## Learning intention

Test the actual product, not the creator's intention.

## Opening

**NOT DONE YET.**

**G — GET FEEDBACK**  
**TEST WHAT YOU BUILT, NOT WHAT YOU INTENDED.**

## Creator test checklist

- Open on mobile
- Start the 21-day program
- Complete at least one representative daily flow
- Enter/save user data if applicable
- Refresh/reopen the app
- Check progress persistence
- Navigate away/back
- Confirm important basic rules from the PRD

## User test

Ask another person to try the product.

Instruction:

> Creator should avoid explaining the interface unless the tester is completely blocked.

Capture:

- `I EXPECTED THEM TO...`
- `THEY ACTUALLY...`
- `THEY GOT STUCK AT...`
- `WHAT WORKED WELL...`
- `MOST IMPORTANT FEEDBACK...`

Store all entries in the Journal.

---

# 21. N — NEXT ITERATION

## Learning intention

Teach prioritization instead of asking AI/Codex to “make it better.”

## Opening

**N — NEXT ITERATION**  
**DON'T FIX EVERYTHING.**

Display the learner's captured feedback.

Ask:

> ถ้าแก้ได้หนึ่งเรื่องก่อน อะไรจะทำให้ Product เข้าใกล้ Goal มากที่สุด?

Require:

### CHANGE

________

### BECAUSE

________

### EXPECTED RESULT

________

Action:

`LOCK NEXT ITERATION`

Guide:

- return to Chat if more thinking is needed;
- solidify the change;
- update the PRD/change request;
- send a specific change request to Codex.

Optional completion:

`VERSION 2 READY`

---

# 22. Completion Experience

The ending should show transformation, not merely celebrate completion.

Example:

**YOU STARTED WITH AN IDEA.**

Now you have:

### A PRODUCT
Public app URL

### A PRD
The definition of what the product should do.

### A CODESIGN JOURNAL
The record of how you clarified, explored, challenged, decided, specified, built, tested, and changed the product.

Reveal CODESIGN again:

**C — Context**  
**O — Options**  
**D — Debate**  
**E — Establish**  
**S — Specify**  
**I — Implement**  
**G — Get Feedback**  
**N — Next Iteration**

Closing line:

> **You don't need the perfect first prompt. You need a process that turns uncertainty into decisions.**

Actions:

- `VIEW MY APP`
- `EXPORT PRD`
- `EXPORT JOURNAL`
- `RETURN TO DASHBOARD`

After successful Guided completion, the UI may show:

`BUILD ON YOUR OWN — UNLOCKED / COMING NEXT`

Do not implement the generic journey until its design is solidified.

---

# 23. CODESIGN Journal

The Journal is automatically assembled as the learner works. It must not require the learner to rewrite the entire journey at the end.

The Journal should prioritize **human thinking and decisions**, not raw Chat transcripts.

Do not automatically store or import the learner's Chat conversation.

Suggested Journal sections:

- Starting Idea
- Initial Content Readiness
- C: Context
- What Chat clarified
- What the learner corrected
- O: Options explored
- Trade-offs
- D: AI assumptions
- Challenges and changes
- E: Locked product scope
- Non-goals
- S: Flow / Screens / Content Structure / Data / Visual Direction / Edge Cases / Acceptance Criteria
- PRD snapshot
- I: Build URL / implementation notes
- G: Test observations
- N: Next iteration decision
- Decision revision history

## Export

MVP:

- Download Journal as Markdown `.md`
- Print-friendly view / browser Save as PDF

---

# 24. Decision History

Locking a decision does not make it impossible to change.

If a locked decision is revised:

- retain the original version;
- record the new version;
- store when it changed;
- optionally capture why it changed;
- show the current decision as active;
- show older decisions as superseded in the Journal.

Never silently overwrite a meaningful locked decision.

---

# 25. Group-Friendly Use

Build with Guide should work for individual learners and small groups.

MVP does **not** require real-time collaborative editing.

A group may use one authenticated project/session as the shared project recorder while members discuss and use Chat together.

UI language should work for both “you” and “your team” where natural.

Possible workshop roles, for facilitator use only, not required as product permissions:

- AI Driver
- Challenger
- Scribe
- Product Owner
- User Advocate

Future multi-user project membership is out of scope for v1.

---

# 26. Dashboard

Authenticated users should have a simple dashboard.

## Sections

### CONTINUE

Current project with phase and Solidification state.

### GUIDED BUILDS

Completed / in-progress Build with Guide projects.

### BUILD ON YOUR OWN

Show locked/coming-next state in v1.

### EXPORTS

Access completed PRDs and Journals from projects.

### SETTINGS

- theme color preset
- account / sign out

---

# 27. Visual Design System

## Character

**RETRO · ARCADE · PIXEL-INSPIRED · PLAYFUL BUT PURPOSEFUL**

CODESIGN should feel like a game/workshop journey, not a corporate form system.

The identity is fixed. Users may change **color theme only**; layout and game character stay consistent.

## Default palette

Recommended initial tokens:

- **Deep Blue:** `#0B1F3A`
- **Leaf Green:** `#5FAE3A`
- **Brown:** `#7A4E2D`
- **Magenta:** `#D91E7A`
- **White:** `#FFFFFF`
- **Orange:** `#FF8A24`

Codex may slightly adjust exact shades for contrast/accessibility while preserving the named palette and visual intent.

## Color roles

- Deep Blue — primary frame, navigation, deep surfaces
- Leaf Green — progress, complete, unlock, positive state
- Brown — secondary surfaces, journal / board-like accents
- Magenta — challenge, emphasis, special states
- Orange — primary action / CTA / energy
- White — readable text / contrast / clean areas

## Gradient usage

Gradients are allowed but should be purposeful, not applied to every card.

Recommended use cases:

- Deep Blue → Magenta for major mission transitions
- Orange → Magenta for strong handoff / build-ready moments
- Leaf Green → Deep Blue for progress / solidification moments

Content-heavy cards, forms, Journal, and long text should generally use solid backgrounds for readability.

## UI style

- blocky retro panels
- pixel-inspired borders
- hard shadows rather than soft glassmorphism
- mission / unlock language
- responsive cards
- strong progress states
- subtle arcade transition effects
- no excessive continuous animation
- reduced-motion support

## Typography

Recommended:

- Short English arcade headings: pixel/display font such as Press Start 2P
- Thai and body text: readable Thai-capable font such as Chakra Petch or a clean Thai sans

Do not use pixel font for long paragraphs, forms, PRD, Journal, or dense mobile content.

## Theme customization

MVP should support at least a theme-color preference architecture.

The user's theme may alter palette mapping but must preserve:

- Retro/arcade identity
- Layout
- typography hierarchy
- interaction language
- gameplay mechanics

Custom CSS/theme layout editing is out of scope.

---

# 28. Responsive & Accessibility Requirements

CODESIGN will be used in workshops, often on laptops and tablets, and must remain usable on mobile.

Requirements:

- mobile-first responsive layout;
- no page-level horizontal scrolling except deliberate local scrollers;
- minimum ~44px touch targets;
- labels must remain visible; do not rely on placeholders alone;
- no hover-only essential interaction;
- keyboard-accessible primary controls;
- clear focus states;
- accessible contrast;
- reduced-motion preference respected;
- forms preserve entered data when navigating between local steps;
- long PRD/Journal content must remain readable on narrow screens.

---

# 29. Persistence & Resume Behavior

Because CODESIGN has Auth + Database:

- project progress must persist across sessions/devices;
- current phase must be saved;
- captured entries must save reliably;
- locked decisions and decision history must persist;
- PRD snapshots and Journal entries must persist;
- build URL and feedback must persist;
- users must be able to resume an incomplete project.

Use autosave where appropriate, with visible save state such as:

- Saving...
- Saved
- Save failed — retry

Never imply data is saved if a write failed.

---

# 30. Recommended Data Model

Exact schema may be refined during implementation, but preserve the conceptual separation below.

## profiles

- id / auth user id
- display_name
- email
- theme_preference
- created_at
- updated_at

## projects

- id
- owner_id
- mode (`guided`, future `own`)
- title
- topic
- content_readiness
- status
- current_phase
- solidification_stage
- created_at
- updated_at
- completed_at

## phase_entries

Structured fields captured during C/O/D/E/S/I/G/N.

- id
- project_id
- phase
- section
- field_key
- content
- status (`captured`, `locked`, `superseded`)
- version
- created_at
- updated_at

## decisions

For meaningful locked decisions.

- id
- project_id
- phase
- decision_type
- content
- version
- is_current
- supersedes_decision_id nullable
- reason_for_change nullable
- created_at

## prd_snapshots

- id
- project_id
- version
- markdown_content
- status
- created_at

## app_builds

- id
- project_id
- version_label
- app_url
- repository_url nullable
- created_at

## feedback_entries

- id
- project_id
- feedback_type
- content
- created_at

## journal_snapshots

Optional cached export. Journal may also be assembled dynamically from structured data.

- id
- project_id
- version
- markdown_content
- created_at

---

# 31. Privacy & Security

CODESIGN projects and Journals are private by default.

Requirements:

- Supabase Row Level Security or equivalent owner-level data isolation;
- user sees only their own projects in v1;
- no public project listing;
- do not capture raw Chat transcripts automatically;
- do not ask users to paste secrets/API keys;
- do not store Codex credentials;
- allow user to delete a project;
- design schema to support account deletion;
- exported PRD/Journal belongs to the user.

Future team-sharing must require explicit invitation and permissions.

---

# 32. Suggested Technical Architecture

This is the recommended implementation for v1 and may be changed if needed without altering the product model.

## Frontend

- React
- TypeScript
- Vite
- React Router

## Backend / Cloud

- Supabase Auth
- Supabase Postgres
- Row Level Security

## Hosting

Recommended: Vercel or another SPA-friendly static frontend host.

The CODESIGN platform does not need to be hosted on GitHub Pages.

Learner-built Basic apps are the products that should be deployable to GitHub Pages.

## State

- server-backed project state from Supabase
- local optimistic form state
- autosave with clear status

## No embedded AI

Do not add OpenAI, ChatGPT, Codex, Gemini, or other AI APIs inside CODESIGN v1.

External Chat and Codex use is intentional and part of the learning design.

---

# 33. Non-Goals for v1

Do not implement in v1 unless later explicitly requested:

- embedded AI chatbot;
- automatic semantic grading of learner answers;
- “AI score” or correctness score;
- automatic PRD generation that invents missing decisions;
- real-time multiplayer editing;
- team permissions / invitations;
- facilitator monitoring dashboard;
- automated GitHub repository creation;
- automated GitHub Pages deployment;
- in-browser code editor;
- Advanced course for Auth/Database/cloud architecture;
- generic Build on Your Own journey beyond a locked/coming-next shell;
- social feed, public project gallery, leaderboard;
- storing raw Chat transcripts.

---

# 34. Analytics — Optional / Privacy-Safe

If product analytics are later added, useful aggregate events may include:

- guide_started
- auth_completed
- project_created
- phase_completed
- hint_opened
- chat_move_opened
- prd_exported
- build_url_saved
- guided_completed

Do not send learner-entered project content as analytics event properties.

Analytics are optional for v1.

---

# 35. Acceptance Criteria for CODESIGN v1

CODESIGN v1 is considered launch-ready when:

1. A public visitor can understand Build with Guide without signing in.
2. Pressing Start Building triggers Auth before any persistent build journey begins.
3. An authenticated learner can create a `21 DAYS OF ______` project.
4. The learner can complete C, O, D, E, and S in order using structured capture/review/lock flows.
5. Guidance, Thinking Hint, and Chat Move are available where specified.
6. Phase progress is persisted in the database and resumes on another session.
7. The Solidification state correctly moves through IDEA → UNDERSTOOD → EXPLORED → DECIDED → SOLID → BUILD READY based on completion/lock rules.
8. The UI clearly states that Solidification is progress/completeness, not correctness.
9. Locked decisions are retained and revision history is possible without silent overwrite.
10. S includes flow, behavior, content/data structure, visual character, edge cases, and acceptance criteria.
11. A PRD can be assembled from the learner's structured inputs without embedded AI.
12. The learner can review, edit, lock, copy, and download the PRD as Markdown.
13. I guides the learner to use Codex externally and allows saving the working app URL.
14. G supports creator testing plus another user's observed feedback.
15. N requires one prioritized change with rationale and expected result.
16. A CODESIGN Journal is assembled automatically from the journey and can be exported as Markdown.
17. The completion screen shows Product + PRD + Journal.
18. The UI uses the defined retro/arcade identity and default Deep Blue / Leaf Green / Brown / Magenta / White / Orange palette.
19. The experience works well on desktop, tablet, and mobile.
20. CODESIGN stores project data privately by authenticated user with proper database access controls.
21. No embedded AI API exists in v1.
22. No semantic correctness score exists in v1.
23. Build on Your Own is visible as the next mode but Codex does not invent its unsolidified learning flow.

---

# 36. Recommended Build Sequence for Codex

To reduce risk, implement in this order:

### Milestone 1 — Product Shell

- visual system
- public landing
- mission brief
- responsive layout
- mission map
- solidification meter component

### Milestone 2 — Auth + Project Persistence

- Supabase project
- Auth Gate
- user profile
- create/resume guided project
- database schema + RLS
- autosave

### Milestone 3 — C/O/D/E

- reusable phase layout
- guidance layers
- capture fields
- review/lock gates
- decision history foundation
- progress transitions

### Milestone 4 — S

- S1 flow builder
- S2 screens/behavior
- S3 content/data structure
- S4 character/visual direction
- S5 edge cases/acceptance criteria

### Milestone 5 — PRD

- deterministic PRD assembly
- editable preview
- lock snapshot
- Markdown export/copy

### Milestone 6 — I/G/N

- external Codex guidance
- build URL storage
- testing flow
- feedback capture
- next iteration decision

### Milestone 7 — Journal + Completion

- dynamic Journal
- Markdown export
- print styling
- completion experience
- dashboard history

### Milestone 8 — QA

- mobile QA
- auth/session QA
- persistence QA
- RLS/security checks
- accessibility checks
- resume interrupted journey
- decision revision behavior

---

# 37. Product Language / Copy Principles

Use concise game language rather than academic terminology.

Examples:

- `DON'T DESIGN YET.`
- `DON'T FALL IN LOVE WITH THE FIRST IDEA.`
- `AI SOUNDS CONFIDENT. THAT DOESN'T MAKE IT RIGHT.`
- `EXPLORATION ENDS HERE.`
- `SCOPE LOCKED.`
- `PRODUCT DEFINITION: SOLID`
- `PRD SOLIDIFIED`
- `HANDOFF READY`
- `YOU KNOW WHAT TO BUILD. NOW LET CODEX BUILD IT.`
- `TEST WHAT YOU BUILT, NOT WHAT YOU INTENDED.`
- `DON'T FIX EVERYTHING.`

Tone:

- energetic;
- clear;
- non-patronizing;
- no fake grading;
- human remains accountable for product decisions.

---

# 38. Final Product Principle

CODESIGN is not an AI that designs the product for the learner.

It is a structured environment that helps the learner:

> **think → converse → capture → challenge → decide → specify → build → test → iterate**

The platform controls the **process**, not the learner's answer.

The intended learning transfer is that after the guided build, the learner can use the same working method on a completely different product.

---

## Codex Handoff Note

Before implementation, Codex should treat this PRD as the source of truth for CODESIGN v1.

Where this PRD is explicit, implement it faithfully. Where the PRD leaves visual micro-details or low-risk technical implementation choices open, make reasonable implementation decisions consistent with the retro arcade design system. Where an ambiguity would alter the learning model, user journey, data/privacy model, or product behavior, flag it instead of inventing a new product rule.
