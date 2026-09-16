# codesign-ai

พื้นที่สำหรับเชื่อม GPT-5.6 Sol ฝั่ง server ตาม
`docs/build-your-own-v2/AI_DESIGN.md`

Phase 3A เพิ่ม action policy, structured proposal contract และ usage reservation
foundation แล้ว Phase 3B-1 เพิ่ม pure server-side prompt assembly, narrow request
validation และ evaluation fixtures ภาษาไทย/อังกฤษ โดย authoritative context ใช้เฉพาะ
current accepted decisions และติดป้าย user draft เป็น untrusted data ทุกครั้ง

ยังไม่มี API client หรือ key และ allowance ทุก Project เริ่มเป็น disabled ให้เชื่อม
OpenAI หลังอนุมัติ allowance, retention และ moderation UX เท่านั้น

`index.ts` เป็น fail-closed endpoint ที่ตอบ `503 AI_NOT_CONFIGURED` จนกว่าจะมี
server configuration ครบ จึงสามารถวางโครงสร้างไว้ได้โดยไม่เกิดค่าใช้จ่าย

Shared server modules อยู่ที่ `supabase/functions/_shared/codesign-ai/` และยังไม่
bundle เข้า endpoint จนกว่า JWT verification, token counting และ reservation flow
พร้อมทำงานครบวงจร
