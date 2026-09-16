# codesign-ai

พื้นที่สำหรับเชื่อม GPT-5.6 Sol ฝั่ง server ตาม
`docs/build-your-own-v2/AI_DESIGN.md`

Phase 3B-2 เชื่อม Responses API ฝั่ง Supabase Edge Function แล้ว โดย:

- ตรวจ JWT และยืนยันว่าเป็นเจ้าของ Own Project ที่ยัง active
- นับ input token ก่อน reserve งบ และจำกัด 40,000 input tokens ต่อคำขอ
- เลือก model, reasoning effort, output limit และ strict schema ฝั่ง server เท่านั้น
- ตั้ง `store: false` และเก็บเฉพาะ structured proposal, usage และ cost ledger
- รองรับ idempotency และ fail closed เมื่อผลลัพธ์จาก provider ไม่แน่นอน

ทุก Project ยังเริ่มด้วย AI allowance แบบ disabled และ internal test allowance จำกัด
5 requests / 1 USD ต่อ Project การเปิด allowance ต้องทำโดย Admin ผ่าน RPC
`admin_enable_ai_test_allowance`

ก่อนใช้งานจริง ต้องเพิ่ม `OPENAI_API_KEY` ใน Supabase Edge Function secrets เท่านั้น
ห้ามใส่ key ใน frontend หรือ repository หาก secret ยังไม่มี endpoint จะตอบ
`503 AI_NOT_CONFIGURED` โดยไม่เกิดค่าใช้จ่าย
