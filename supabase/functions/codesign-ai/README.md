# codesign-ai

พื้นที่สำหรับเชื่อม GPT-5.6 Sol ฝั่ง server ตาม
`docs/build-your-own-v2/AI_DESIGN.md`

Phase 3A เพิ่ม action policy, structured proposal contract และ usage reservation
foundation แล้ว แต่ยังไม่มี API client หรือ key และ allowance ทุก Project เริ่มเป็น
disabled ให้เชื่อม OpenAI หลังอนุมัติ allowance และ retention เท่านั้น

`index.ts` เป็น fail-closed endpoint ที่ตอบ `503 AI_NOT_CONFIGURED` จนกว่าจะมี
server configuration ครบ จึงสามารถวางโครงสร้างไว้ได้โดยไม่เกิดค่าใช้จ่าย
