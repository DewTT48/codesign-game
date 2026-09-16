# CODESIGN Build Your Own v2 — AI Design

สถานะ: Phase 3B-2 backend และ hosted Edge Function deployed แล้ว; Edge secret พร้อม
และทุก Project ยังคง fail closed จนกว่า Admin จะเปิด bounded internal allowance

## บทบาทของ AI

AI เป็น thinking partner ภายใน CODESIGN ไม่ใช่ผู้ตัดสินใจแทน Product owner โดยทำงานสี่แบบ:

1. ตีประเด็นและช่วยจัดโครงสร้างข้อมูลที่ผู้ใช้ให้
2. ท้าทาย assumptions และชี้ evidence gap/failure mode
3. ตรวจ cross-step consistency ระหว่าง Context, Options, Debate, Establish และ Specify
4. สร้าง PRD draft จาก accepted decisions

ทุก response ต้องแยก `proposal`, `questions`, `warnings` และ `decision_status = proposed` ให้ชัดเจน UI ต้องให้ผู้ใช้ Accept/Edit ก่อนบันทึกเป็น decision

## Model policy

- Model เดียว: `gpt-5.6-sol`
- API: Responses API ผ่าน `supabase/functions/codesign-ai/`
- ห้ามเรียก OpenAI จาก browser และห้ามส่ง API key ไป frontend
- Model ID เป็น server-side allowlist constant ผู้ใช้เปลี่ยน model เองไม่ได้

OpenAI Docs ระบุว่า GPT-5.6 Sol รองรับ Responses API, Structured Outputs และ reasoning effort ตั้งแต่ `none`, `low`, `medium`, `high`, `xhigh`, `max` จึงใช้ model เดียวแล้วปรับ effort ตามงานได้ ([GPT-5.6 Sol model](https://developers.openai.com/api/docs/models/gpt-5.6-sol)).

### Reasoning effort matrix

| งาน | Effort เริ่มต้น | เหตุผล |
|---|---:|---|
| สรุป/จัดหมวดข้อความสั้น, ตรวจรูปแบบ | `low` | งานแปลงรูปแบบ ความเสี่ยงต่ำ |
| ตีประเด็น Context, สร้างคำถาม, เปรียบเทียบ Options | `medium` | ต้องเข้าใจความหมายแต่ยังไม่สังเคราะห์ทั้ง Project |
| ท้าทาย assumptions, ตรวจความขัดแย้งข้าม step | `high` | ต้องหาเหตุผลและผลกระทบหลายชั้น |
| สร้าง/ปรับ PRD ทั้งชุดจาก accepted decisions | `xhigh` | synthesis ขนาดใหญ่และต้องรักษาความสอดคล้อง |
| `max` | ไม่ใช้โดยอัตโนมัติ | เปิดภายหลังได้เมื่อมีข้อมูลคุณภาพและต้นทุนรองรับ |

Effort เป็น server-side policy ไม่รับค่าตรงจาก client เพื่อลดการ bypass cost guardrail

## Request flow

```text
UI action
  → Supabase JWT
  → codesign-ai Edge Function
  → verify project ownership + mode
  → build prompt from accepted project state
  → count input tokens
  → reserve usage budget (atomic)
  → OpenAI Responses API
  → validate structured output
  → record actual usage/status
  → return proposal to UI
  → user Accept/Edit/Reject/Regenerate
  → store reviewed content separately from immutable provider output
  → lock the completed page as the authoritative decision snapshot
```

Request body ควรรับเฉพาะ `projectId`, `action`, `userDraft`, `locale`, `idempotencyKey` ส่วน model, effort, system prompt, accepted context และ allowance อ่านจาก server/database

## Structured response contract

```json
{
  "action": "challenge_assumptions",
  "decision_status": "proposed",
  "proposal": {},
  "questions": [],
  "warnings": [],
  "consistency": {
    "status": "aligned",
    "conflicts": []
  }
}
```

Schema จริงแยกตาม action และ validate ทั้งฝั่ง Edge Function กับ frontend ห้ามบันทึก raw model output เป็น accepted decision โดยตรง

## Usage metering

Phase 3A เพิ่ม `ai_requests` แบบหนึ่งแถวต่อ request โดยมี:

- `project_id`, `owner_id`, `action`, `model`, `reasoning_effort`
- `idempotency_key`, `openai_response_id`, `status`
- `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_tokens`, `total_tokens`
- `estimated_input_tokens`, `reserved_output_tokens`, `reserved_cost_micros`
- `actual_cost_micros`, `started_at`, `completed_at`, `error_code`

Responses API ส่ง usage ที่มี input, output และ total token พร้อมรายละเอียด token ได้ จึงต้องเก็บค่าจริงหลังจบ request ([Responses API reference](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)). ราคาต่อ token ถูกบันทึกด้วย pricing version ฝั่ง server และต้องตรวจทานเมื่อราคา model เปลี่ยน

## Hard limits และ cost guardrails

ก่อนเรียก OpenAI ทุกครั้ง Edge Function ต้องทำ atomic budget reservation:

1. ตรวจ Project ยัง active และเป็นของ user
2. ตรวจ request-level input size และกำหนด `max_output_tokens`
3. lock usage budget ของ Project
4. ปฏิเสธก่อนเรียก API หากเกิน request count/token/cost limit
5. บันทึก reservation ด้วย idempotency key
6. หลัง response ให้ reconcile reserved กับ actual usage
7. retry ได้เฉพาะ error ที่ปลอดภัย และต้องใช้ idempotency key เดิม

Guardrail ขั้นต่ำ:

- per-request input/output ceiling
- per-Project cumulative token/cost ceiling
- concurrency limit ต่อ Project
- regeneration/rate limit ต่อช่วงเวลา
- timeout และ circuit breaker
- no automatic fallback ไป model อื่น
- เมื่อถึง limit ผู้ใช้ยังอ่าน แก้ไข Accept และ export งานได้ เพียงหยุด AI generation

Internal test allowance กำหนดไว้ที่ 5 requests, 100,000 input tokens, 40,000
output tokens, 140,000 total tokens และ hard cap 1 USD ต่อ Project เปิดได้โดย
Admin เท่านั้น ค่าเหล่านี้ยังไม่ใช่ production cohort policy

## Phase 3A implementation boundary

- Migration `20260916140000_ai_usage_foundation.sql` เพิ่ม budget/request ledger, RLS และ atomic reserve/start/finalize RPCs
- ทุก Project เริ่มโดยไม่มี budget; budget ที่สร้างใหม่มีสถานะ `disabled`
- reservation RPC ใช้ได้เฉพาะ `service_role`; browser และ Admin แก้ counter โดยตรงไม่ได้
- owner อ่าน ledger ของตนได้ และ Admin อ่านได้แบบ read-only เพื่อ support/audit
- stale reservation ที่ยังไม่เริ่มถูกยกเลิกได้เมื่อหมดอายุ; request ที่เป็น `in_progress` จะไม่ถูก auto-release เพื่อป้องกัน double spend
- model/effort/prompt version/output schema version ถูกบันทึกใน ledger และ idempotency key เดิมใช้กับ payload ต่างกันไม่ได้
- หากไม่มี `OPENAI_API_KEY`, `supabase/functions/codesign-ai/index.ts` ตอบ
  `503 AI_NOT_CONFIGURED` ก่อน authentication/provider call

## Phase 3B-2 implementation boundary

- นับ token ด้วย Responses input-token endpoint ก่อน atomic reservation
- ใช้ strict action-specific JSON schema, server-selected reasoning และ `store: false`
- Migration `20260916150000_ai_proposals_and_test_allowance.sql` เพิ่ม structured
  proposal persistence และ Admin internal allowance RPC
- เก็บเฉพาะ proposal envelope, usage, upstream response ID, cost และ pricing version
  ไม่เก็บ raw prompt/response
- request ที่ provider ปฏิเสธแบบยืนยันได้ถูก finalize; network/timeout/5xx ที่ผลลัพธ์
  ไม่แน่นอนคง `in_progress` และห้าม auto-retry เพื่อป้องกัน double spend
- idempotent retry คืน proposal เดิมและ reconcile ledger โดยไม่ยิง model ซ้ำ
- backend deployed บน hosted Supabase แล้ว แต่ UI/review integration และ model eval จริง
  ยังเป็นงานถัดไป

## Prompt และ decision integrity

- Prompt ใช้เฉพาะ accepted/locked decisions เป็น authoritative context
- User draft ต้องติด label ว่า untrusted input
- AI ต้องไม่ silently rewrite locked decisions
- หากพบ conflict ให้ส่ง warning และ route กลับไปยัง step ที่เกี่ยวข้อง
- PRD generation ต้องบันทึก source decision versions เพื่อ reproduce ได้
- เก็บ prompt template version และ output schema version ทุก request
- Thai typography: output ภาษาไทยใช้การเว้นวรรคธรรมชาติ ไม่แทรกช่องว่างระหว่างคำไทย และคง technical terms เฉพาะที่ช่วยความหมาย

## Security และ privacy

- เก็บ `OPENAI_API_KEY` ใน Edge Function secret เท่านั้น
- ตรวจ JWT และ project ownership ทุก request
- ใช้ stable hashed `safety_identifier` แทน email/raw identifier
- redact secret และข้อมูลที่ไม่จำเป็นก่อนส่ง model
- ไม่ log full prompt/response ใน platform log; ถ้าต้องเก็บเพื่อ audit ให้กำหนด retention และสิทธิ์อ่าน
- ตั้ง `store: false` เป็นค่าเริ่มต้น เพื่อลด application-state retention; OpenAI Docs ระบุว่า Responses API เก็บ application state อย่างน้อย 30 วันเมื่อใช้ค่า default หรือ `store: true` ([data controls](https://developers.openai.com/api/docs/guides/your-data))
- Project Pass ไม่ให้สิทธิ์นำ API key หรือ usage ไปใช้กับ ChatGPT/Codex/third-party

## Failure behavior

- ถ้า OpenAI timeout/network/5xx แล้วไม่ทราบว่าเกิด generation หรือไม่: คง reservation
  เพื่อ manual reconciliation และไม่ auto-retry
- ถ้า provider ปฏิเสธก่อน generation แบบยืนยันได้: finalize failed และ release reservation ตาม usage จริง
- ถ้า output ไม่ผ่าน schema: บันทึก failed usage ตาม token ที่เกิดจริง แล้วแจ้งให้ retry ภายใต้ allowance
- ถ้า response กลับมาแต่ client หลุด: idempotency key ใช้ดึงผลเดิม ไม่ยิงซ้ำ
- ถ้า metering write ล้มเหลว: fail closed ก่อนเรียก model

## Assumptions / decisions ที่ยังต้องตรวจสอบ

- allowance สำหรับ cohort หลัง internal test
- retention policy หากอนาคตต้องเก็บข้อมูลมากกว่า structured proposal (ปัจจุบันไม่เก็บ raw)
- AI actions ใดให้ regenerate ได้กี่ครั้ง
- จะเปิด streaming ใน UI หรือส่ง response ครั้งเดียว
- moderation policy และ UX เมื่อ content ถูกปฏิเสธ
- prompt/template evaluation set สำหรับภาษาไทยและอังกฤษ
