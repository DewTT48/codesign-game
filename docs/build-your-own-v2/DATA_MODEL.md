# CODESIGN Build Your Own v2 — Data Model

สถานะ: Phase 1 และ Phase 3A implemented locally ใน migrations `20260916120000_build_your_own_project_passes.sql` และ `20260916140000_ai_usage_foundation.sql`

## Existing model ที่ reuse

- `projects.mode` รองรับ `guided | own` อยู่แล้ว
- Journey tables (`phase_entries`, `decisions`, `prd_snapshots`, `app_builds`, `feedback_entries`, `journal_snapshots`) อ้าง `project_id` จึง reuse ได้
- `profiles` ผูกกับ Supabase Auth
- `private.admin_users` และ `private.is_admin()` เป็นฐานสิทธิ์ Admin เดิม

ไม่มีการแก้ row ของ Project เดิมและไม่มีการ backfill Pass ให้ Guided Project

## `project_passes`

หนึ่งแถวคือหนึ่ง entitlement ไม่ใช่ balance aggregate

| Field | ความหมาย |
|---|---|
| `id` | Pass identifier |
| `owner_id` | เจ้าของสิทธิ์ |
| `source` | `course`, `stripe`, `admin` |
| `status` | `available`, `consumed`, `revoked` |
| `grant_key` | stable unique key ป้องกัน duplicate grant |
| `granted_by` | Admin/actor ที่ grant; nullable สำหรับ server flow ในอนาคต |
| `project_id` | Project ที่ใช้ Pass เปิด; เป็น null ได้หลัง Project ถูกลบ |
| `consume_key` | idempotency key ที่ unique ต่อ owner; เก็บไว้แม้ Project ถูกลบ |
| `note` | เหตุผล/support note |
| timestamps | เวลา grant/consume/revoke/update |

Constraints บังคับ state ให้สอดคล้อง เช่น available ต้องไม่มี `project_id`/consume time และ consumed ต้องมี `consumed_at` การลบ Project ใช้ `ON DELETE SET NULL` จึงเก็บสถานะ consumed ต่อไป

## `project_pass_events`

Append-only audit log สำหรับ `granted`, `consumed`, `revoked`, `restored` เก็บ Pass, owner, Project, actor, reason, metadata และเวลา ผู้ใช้แก้ไขหรือลบ event ไม่ได้

## RPC contract

### Read

`get_my_project_passes()` คืน Pass ของ user ปัจจุบันตามลำดับ grant

### Admin grant

`admin_grant_project_pass(target_user_id, target_source, target_grant_key, target_note)`

- ต้องเป็น Admin
- Phase 1 รับ source `course | admin`
- grant key เดิมกับ owner/source เดิมคืน row เดิมแบบ idempotent
- source `stripe` ถูกปฏิเสธเพื่อบังคับผ่าน verified webhook ในอนาคต

### Admin revoke/restore

- `admin_revoke_project_pass(target_pass_id, target_reason)` ใช้ได้เฉพาะ available
- `admin_restore_project_pass(target_pass_id, target_reason)` ใช้ได้เฉพาะ revoked
- ทั้งสอง action บังคับ reason และสร้าง audit event

### Atomic create/consume

`create_own_project_with_pass(target_title, target_topic, target_creation_key)`

ภายใน transaction ของ PostgreSQL function:

1. validate auth/title/topic/creation key
2. หาก key เดิมสำเร็จแล้ว ให้คืน Project เดิมโดยไม่ใช้ Pass เพิ่ม
3. `SELECT ... FOR UPDATE SKIP LOCKED` Pass available ที่เก่าสุดหนึ่งแถว
4. insert `projects.mode = 'own'`
5. update Pass เป็น consumed ผูก `project_id` และ unique `consume_key`
6. insert consumed event
7. return Project

Exception ในขั้นใดทำให้ statement/transaction rollback ทั้งหมด Concurrent request ที่ชน Pass เดียวกันจะมีเพียงหนึ่ง request สำเร็จ

`content_readiness = 'idea'` ถูกใส่เป็น compatibility value เพราะ column เดิมเป็น `NOT NULL` และใช้ความหมายกับ Guided เป็นหลัก ก่อนเปิด Own UI ควรพิจารณา migration แยกเพื่อลด semantic coupling โดยต้องไม่ทำให้ Guided เสีย

## RLS / privilege matrix

| Actor | Pass rows | Events | Create Guided | Create Own |
|---|---|---|---|---|
| Anonymous | ไม่ได้ | ไม่ได้ | ไม่ได้ | ไม่ได้ |
| Authenticated owner | SELECT ของตนเอง | SELECT ของตนเอง | direct insert เดิม | atomic RPC เท่านั้น |
| Other user | ไม่เห็น | ไม่เห็น | เฉพาะ owner_id ตน | ใช้ Pass ตนเท่านั้น |
| Admin | SELECT ทั้งหมด | SELECT ทั้งหมด | เหมือนเดิม | grant/revoke/restore ผ่าน RPC |
| Edge service role | server-only | server-only | ไม่ใช้จาก browser | สำหรับ verified Stripe flow ในอนาคต |

Authenticated role ถูก revoke INSERT/UPDATE/DELETE บน Pass tables แม้ migration เดิมมี default table grants

## TypeScript model

`src/lib/supabase/database.types.ts` มี `ProjectPassRow`, `ProjectPassEventRow` และ RPC signatures เพื่อให้ frontend เรียก read/create แบบ typed

## AI usage foundation

### `ai_project_budgets`

หนึ่งแถวต่อ Own Project เก็บ limit version, hard limits แยก request/input/output/total/cost และ counter แบบ `reserved`/`used` ค่าเริ่มต้นเป็น `disabled`; จะเปลี่ยนเป็น `enabled` ได้เมื่อ limit ทุกค่าถูกกำหนดเท่านั้น

### `ai_requests`

หนึ่งแถวต่อ logical request เก็บ action, model, server-selected reasoning effort, idempotency key, prompt/schema version, lifecycle status, reservation, actual token/cost usage, upstream response ID และ error code

RPC server-only ทำ state transition ดังนี้:

1. `reserve_ai_request(...)` lock budget, ตรวจ hard limits และ reserve แบบ atomic
2. `mark_ai_request_started(...)` เปลี่ยน reservation เป็น `in_progress`
3. `finalize_ai_request(...)` reconcile ค่าที่ reserve กับ usage จริงและ mark budget exhausted เมื่อชน boundary

Owner และ Admin อ่าน ledger/summary ได้ แต่ browser ไม่มีสิทธิ์ insert/update/delete และเรียก state-transition RPC ไม่ได้ Admin จึงรองรับงาน support แบบ read-only ตั้งแต่ระดับข้อมูล แม้หน้า Admin UI จะอยู่ Phase 5

Accepted decisions ยังใช้ `decisions` เดิม AI proposal ไม่มีสิทธิ์เขียนทับ current decision โดยอัตโนมัติ

## Data model สำหรับ Phase ถัดไป

### Billing

- `billing_customers`, `pass_purchases`, `billing_events`
- Stripe IDs ต้อง unique และไม่เก็บข้อมูลบัตร
- Stripe webhook grant ต้องใช้ server-only function ไม่ reuse admin-auth function

## Compatibility และ rollback

- Guided insert policy เปลี่ยนเงื่อนไขเพียงเพิ่ม `mode = 'guided'`; default mode เดิมยังเป็น guided
- Project select/update/delete policies และ Journey child policies ไม่เปลี่ยน
- การ rollback migration ต้องทำหลังตรวจว่าไม่มี Own Project/Pass ที่ production ใช้แล้ว เพราะการ drop audit data เป็น destructive operation

## Assumptions / decisions ที่ยังต้องตรวจสอบ

- ความหมายระยะยาวของ `content_readiness` สำหรับ Own Project
- retention ของ audit events
- support policy สำหรับ consumed Pass ที่ให้ผิดคน; Phase 1 ใช้วิธี grant ชดเชย ไม่ restore row consumed
- source-of-truth และ stable key ของ Course entitlement
- AI allowance/retention policy และ Billing schemas สุดท้ายหลังได้ price, refund และ expiry decision
