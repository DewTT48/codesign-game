# CODESIGN Build Your Own v2 — Implementation Plan

สถานะอัปเดต: 16 กันยายน 2026

## หลักการ rollout

- ทำ additive change และเปิดด้วย feature flag
- deploy database ก่อน client ที่เรียก RPC ใหม่
- ไม่เปิด Stripe Live หรือ AI production จน decision gate และ observability พร้อม
- regression test Guided 21 Days ทุก phase
- ทุก migration ทดลองใน local Supabase ก่อน remote

## Phase 0 — Repository discovery และ rules

สถานะ: เสร็จแล้ว

- ตรวจ README, PRD v1, auth, project creation, Journey services, RLS/RPC, Admin และ tests
- ยืนยันว่า `projects.mode = 'own'` และ child data model reuse ได้
- แยก confirmed decisions ออกจาก assumptions
- จัดทำเอกสารชุดนี้

## Phase 1 — Project Pass foundation

สถานะ: implemented locally; รอ local database test environment ยืนยัน

- เพิ่ม `project_passes` และ `project_pass_events`
- เพิ่ม RLS/read RPC
- เพิ่ม Admin grant/revoke/restore RPC
- เพิ่ม atomic `create_own_project_with_pass`
- ปิด direct browser insert ของ own modeโดยคง Guided insert เดิม
- เพิ่ม TypeScript types, validation และ frontend service foundation
- เพิ่ม pgTAP database tests สำหรับ ownership, privilege, idempotency, one-pass-one-project, rollback และ no-refund-on-delete
- เพิ่ม unit tests สำหรับ input/service contract
- ยังไม่มี route/UI ที่เปิดให้ผู้ใช้สร้าง Own Project

Definition of done:

- lint, typecheck, unit tests และ build ผ่าน
- local Supabase migration reset + database tests ผ่านเมื่อ environment มี Supabase CLI/Docker
- Guided regression tests ผ่าน

## Phase 2 — Build Your Own entry UI

สถานะ: implemented locally behind `VITE_BUILD_YOUR_OWN_V2`; ยังไม่เปิด production

- feature flag สำหรับ dashboard/route
- แสดง Pass inventory และสถานะ ไม่มีคำว่า Free Pass
- create form ที่การพิมพ์ไม่หัก Pass และมี confirm step ชัดเจน
- เรียก atomic RPC เมื่อ confirm เท่านั้น
- ป้องกัน double submit และแสดงผล conflict/no-pass แบบเข้าใจง่าย
- แยก title/topic และ content/copy ที่ไม่ผูกกับ 21 Days
- audit accessibility และ Thai/English copy

สิ่งที่ทำแล้ว:

- Dashboard launch panel และ Pass inventory
- `/projects/new/own` พร้อม validation, confirm dialog และ idempotent creation key
- no-Pass/error states โดยยังไม่เปิด checkout
- `/own-projects/:projectId` เป็น preview workspace แยกจาก Guided Journey
- redirect ป้องกัน Own Project เข้า route/prompt ของ Guided โดยตรง
- unit/UI tests สำหรับ confirm boundary, no-Pass state, dashboard routing และ workspace separation

ก่อนเปิดปุ่ม `START C — CONTEXT`: ต้องอนุมัติ Own Journey content/gates ที่ต่างจาก Guided

## Phase 3 — AI foundation

สถานะ Phase 3A: implemented locally แบบ fail closed; ยังไม่เรียก OpenAI

สิ่งที่ทำแล้ว:

- เพิ่ม `ai_requests`/`ai_project_budgets` และ atomic reservation/start/reconciliation RPCs
- server allowlist เฉพาะ `gpt-5.6-sol` และ action→reasoning effort policy
- structured proposal schemas แยก action และบังคับ `decision_status = proposed`
- Accept/Edit & Accept/Reject/Regenerate review helper โดย Reject/Regenerate ไม่คืน accepted candidate
- hard limits สำหรับ request/input/output/total tokens/cost, one-active-request concurrency และ idempotency payload check
- owner isolation และ Admin read-only access สำหรับ support/audit
- สร้าง `supabase/functions/codesign-ai/` ที่ตอบ `503 AI_NOT_CONFIGURED` จนกว่า config จะครบ
- เพิ่ม unit tests และ pgTAP tests สำหรับ policy, schema, limit, lifecycle, reconciliation และ RLS

Phase 3B ที่ยังไม่ทำ:

- input token count, Responses API call, timeout/circuit breaker และ structured-output validation ฝั่ง server
- proposal persistence/UI และ Accept/Edit/Reject/Regenerate integration กับ decision history
- logging/dashboard ที่ redact ข้อมูล และการรัน eval กับ model จริง

Phase 3B-1 ที่ทำแล้วแบบไม่เรียก API:

- pure server-side prompt assembly จาก current accepted decisions เท่านั้น
- canonical/deterministic context และ source decision versions สำหรับ reproduce
- untrusted-input labeling และ developer instruction ป้องกัน role/output override
- narrow browser request contract ที่ไม่รับ model หรือ reasoning effort จาก client
- eval fixtures ภาษาไทย/อังกฤษ: hallucination, cross-step conflict, PRD fidelity และ prompt injection
- endpoint ยังคง fail closed และยังไม่เกิดค่าใช้จ่าย

ก่อนเปิด production: ต้องกำหนด allowance, retention และ moderation UX

## Phase 4 — Stripe Test Mode

- เพิ่ม billing tables และ server-only grant function
- สร้าง `create-pass-checkout` และ `stripe-webhook`
- verify signature, amount/currency/Price ID/livemode
- webhook/event/grant idempotency
- Test Mode end-to-end และ failure/retry tests
- หน้า purchase status ต้องรอ webhook ไม่เชื่อ redirect

ก่อนเริ่ม implementation ที่ผูกสินค้า: ต้องกำหนดราคา/currency/tax/refund/expiry

## Phase 5 — Admin & support

- Admin UI สำหรับค้น user/Pass และ grant/revoke/restore พร้อม required reason
- อ่าน audit timeline แต่แก้ event ไม่ได้
- support playbook สำหรับ duplicate purchase, wrong account, deleted Project และ payment dispute
- แยกสิทธิ์ Finance/Support หากจำนวน Admin เพิ่ม

## Phase 6 — Hardening และ rollout

- staging migration rehearsal และ backup/restore drill
- load/concurrency tests: create Project และ webhook duplicate
- security review: RLS, Edge secrets, JWT, service role, log redaction
- cost alerts และ kill switch แยก AI/checkout
- เปิด internal → course cohort → paid Test cohort → production ตาม gate
- monitor Guided error rate เทียบ baseline

## Test strategy

### Unit

- Zod validation, service RPC mapping, UI state, locale copy
- AI action→effort mapping และ structured-output parsing
- Stripe event state transitions

### Database

- RLS owner isolation/Admin access
- direct own insert denied; Guided insert accepted
- no Pass/one Pass/multiple Pass/concurrent create
- rollback เมื่อ input/project/event write fail
- delete Project แล้วไม่คืน Pass
- grant/webhook idempotency และ audit completeness
- AI allowance disabled state, atomic reservation/reconciliation, idempotency, hard-limit exhaustion และ Admin read-only access

### Integration/E2E

- auth → inventory → confirm → own workspace
- Test Mode checkout → webhook → Pass → create
- AI reservation → response → Accept/Edit → decision history
- Guided 21 Days full happy path และ archive/restore/delete/export

## Deployment order

1. backup และ apply migration ใน staging
2. run pgTAP + Guided regression
3. deploy Edge Functions แบบ disabled/config missing = fail closed
4. deploy client หลัง RPC พร้อม
5. เปิด feature flag เฉพาะ test users
6. monitor แล้วขยาย cohort

## Decision gates ที่ยังเปิด

- ราคา, currency, tax
- refund/dispute/expiry
- AI allowance และ hard-limit numbers
- course entitlement source/event
- Own Journey prompts/gates และ eligibility ของผู้ใช้เดิม

งานส่วนฐานข้อมูล, RLS, atomic creation, types และ tests ไม่ขึ้นกับค่าข้างต้น จึงเดินหน้าได้แล้ว ส่วนที่ผูก payment/allowance ต้องหยุดที่ gate นี้
