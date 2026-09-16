# CODESIGN Build Your Own v2 — Project Pass & Stripe

สถานะ: Project Pass foundation ทำใน Phase 1; Stripe เป็น design สำหรับ Test Mode เท่านั้น

## หลักการ

- Project Pass เป็น entitlement ใน CODESIGN ไม่ใช่ Stripe credit
- Stripe เป็น payment provider แต่ database เป็นแหล่งจริงของสิทธิ์ใช้งาน
- Client ไม่สามารถ grant/consume/restore/revoke Pass ได้โดยแก้ table ตรง
- Webhook ที่ตรวจ signature แล้วเป็นผู้ยืนยันผลชำระเงิน ห้ามเชื่อ checkout success page อย่างเดียว
- การซื้อซ้ำและ webhook retry ต้อง idempotent

## Phase 1: Course/Admin Pass

Phase 1 รองรับ:

- Admin grant โดยระบุ `source = course | admin` และ `grant_key` ที่ไม่ซ้ำ
- User อ่าน Pass ของตนเอง
- Atomic consume + create Own Project
- Admin revoke Pass ที่ยัง available
- Admin restore Pass ที่ revoked
- Audit event ทุก state transition

Manual grant RPC ตั้งใจปฏิเสธ `source = stripe` เพื่อไม่ให้ admin UI หรือ browser ปลอม paid entitlement เส้นทาง Stripe จะมี server-only function แยกใน Phase Stripe

## Stripe Test Mode architecture

```text
Browser
  → create-pass-checkout Edge Function
  → Stripe Checkout Session (test mode)
  → Stripe-hosted Checkout
  → stripe-webhook Edge Function
  → verify signature + dedupe event
  → record payment + grant one Project Pass
  → Browser polls/refreshes Pass inventory
```

### `create-pass-checkout`

1. รับ Supabase JWT และตรวจ user
2. อ่าน Price ID จาก server env allowlist เท่านั้น
3. สร้าง Checkout Session แบบ one-time payment
4. ใส่ internal `user_id`/purchase reference ใน metadata โดยไม่ใช้ข้อมูลจาก client เป็น authority
5. บันทึก checkout attempt และคืนเฉพาะ Checkout URL/Session ID

### `stripe-webhook`

1. อ่าน raw request body
2. verify `Stripe-Signature` ด้วย webhook secret ของ Test Mode
3. insert Stripe event ด้วย `event.id` ที่ unique ก่อนประมวลผล
4. ตรวจ event type, livemode ต้องเป็น `false`, currency/amount/Price ID ต้องตรง server config
5. เมื่อ payment สำเร็จ ให้ grant Pass ด้วย stable key เช่น `stripe:checkout_session:<id>`
6. commit event + payment record + Pass grant แบบ idempotent
7. ตอบ 2xx เมื่อประมวลผลสำเร็จหรือ event เดิมเสร็จแล้ว

## Data ที่เสนอสำหรับ Stripe phase

### `billing_customers`

- `owner_id`, `stripe_customer_id`, timestamps

### `pass_purchases`

- `id`, `owner_id`, `provider = stripe`, `checkout_session_id`
- `payment_intent_id`, `price_id`, `currency`, `amount_total`
- `status`, `livemode`, `project_pass_id`, timestamps

### `billing_events`

- `provider_event_id` unique, `event_type`, `livemode`
- `processing_status`, `attempt_count`, `last_error`, timestamps

ห้ามเก็บ card number, CVC หรือ Stripe secret ใน database/frontend

## Idempotency rules

- การกด Buy ซ้ำ: client idempotency key + checkout attempt ช่วยลด duplicate session
- Webhook ซ้ำ: unique `provider_event_id`
- Grant ซ้ำจาก session เดิม: unique `grant_key`
- Event มาผิดลำดับ: state machine ต้องรับได้และห้ามย้อน completed payment เป็น pending
- Success page แสดง “กำลังยืนยันการชำระเงิน” จน webhook grant Pass สำเร็จ

## Secret และ environment

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Price ID และ Supabase service-role credential อยู่ใน Edge Function secrets
- Frontend มีได้เฉพาะ publishable values ที่จำเป็น แต่ flow ที่เสนอนี้ใช้ hosted Checkout URL จึงไม่ต้องมี secret
- Test Mode และ Live Mode ต้องใช้คนละ secret, webhook endpoint และ config
- Phase นี้ห้ามสร้าง Live Checkout, ใช้เงินจริง หรือ deploy ไป remote Supabase

## Refund, dispute และ expiry decision gate

ยังไม่ implement automation สำหรับเหตุการณ์ต่อไปนี้จนกว่าจะมี Product/Finance decision:

- refund ก่อน/หลัง consume Pass
- partial refund
- chargeback/dispute เมื่อ Own Project ถูกสร้างแล้ว
- การ revoke access ของ Project ที่สร้างจาก payment ที่ถูกย้อน
- Pass expiry และการแจ้งเตือนก่อนหมดอายุ

จนกว่าจะตัดสินใจ ระบบ production ต้องไม่เปิดขาย ส่วน Test Mode สามารถทดสอบ happy path ด้วยข้อมูลทดสอบได้โดยไม่ grant สิทธิ์ใน environment จริง

## Test matrix สำหรับ Stripe phase

- valid Test Mode checkout → webhook → Pass 1 สิทธิ์
- success redirect มาก่อน webhook → ยังไม่ grant
- webhook เดิมส่งซ้ำ → Pass ยัง 1 สิทธิ์
- signature ผิด/livemode true/amount ไม่ตรง → ปฏิเสธและไม่ grant
- concurrent webhook workers → unique event/grant key ป้องกัน duplicate
- database failure → webhook retry แล้วสำเร็จโดยไม่ duplicate
- ผู้ใช้อื่นอ่าน purchase/Pass ไม่ได้
