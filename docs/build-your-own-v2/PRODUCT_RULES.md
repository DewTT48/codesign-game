# CODESIGN Build Your Own v2 — Product Rules

สถานะ: Foundation specification สำหรับ implementation หลัง Guided 21 Days
วันที่ทบทวน: 16 กันยายน 2026

## เป้าหมาย

Build Your Own ช่วยให้ผู้ใช้ใช้กระบวนการ CODESIGN กับผลิตภัณฑ์ของตนเอง โดย reuse Journey, decision history, Project Record และ PRD เดิม แต่ไม่บังคับรูปแบบ `21 DAYS OF ______` และมี AI อยู่ภายใน CODESIGN เพื่อช่วยคิดอย่างมีโครงสร้าง

Feature นี้ต้องแยกจาก Guided 21 Days อย่างชัดเจน การเพิ่ม `own` ต้องไม่เปลี่ยน creation flow, content, route, progress หรือข้อมูล Project เดิมที่มี `mode = 'guided'`

## คำที่ใช้ในระบบ

- **Guided Project**: Project แบบเดิม (`projects.mode = 'guided'`) สำหรับหลักสูตร 21 Days
- **Own Project**: Project ใหม่ (`projects.mode = 'own'`) ที่เปิดด้วย Project Pass
- **Project Pass**: สิทธิ์แบบ one-time หนึ่งสิทธิ์ต่อหนึ่ง Own Project ไม่ใช้คำว่า Free Pass
- **Course Project Pass**: Project Pass หนึ่งสิทธิ์ที่รวมอยู่ในค่าเรียน
- **AI proposal**: ข้อเสนอจาก AI ที่ยังไม่ถือเป็น Product decision
- **Accepted decision**: ข้อความที่ผู้ใช้กด Accept หรือแก้ไขแล้วกดยืนยัน

## กติกาที่ตัดสินใจแล้ว

1. Build Your Own ไม่มี Free Tier
2. ผู้เรียนหลักสูตรได้รับ Course Project Pass 1 สิทธิ์ซึ่งรวมอยู่ในค่าเรียน
3. ผู้ใช้ทั่วไปและ Own Project ถัดไปต้องซื้อ Project Pass แบบ one-time ผ่าน Stripe
4. Project Pass 1 สิทธิ์เปิด Own Project ได้ 1 Project
5. การเข้าหน้า create หรือกรอกชื่อยังไม่หัก Pass ระบบหักเมื่อผู้ใช้กดยืนยันสร้าง Project เท่านั้น
6. การหัก Pass และสร้าง Project ต้องสำเร็จหรือย้อนกลับพร้อมกันใน database transaction เดียว
7. การลบ Project ไม่คืน Pass อัตโนมัติ
8. Admin grant, revoke หรือ restore Pass ได้เมื่อจำเป็น และทุก action ต้องมี audit event
9. Own Project ใช้ `projects.mode = 'own'` ที่มีอยู่แล้ว ไม่สร้าง project table ชุดใหม่
10. CODESIGN ใช้ GPT-5.6 Sol เพียง model เดียวตลอด flow และปรับ reasoning effort ตามประเภทงาน
11. AI ช่วยตีประเด็น ท้าทาย assumptions ตรวจความสอดคล้อง และร่าง PRD แต่ AI ไม่มีสิทธิ์ lock หรือเปลี่ยน Product decision เอง
12. ทุกผลจาก AI ต้องผ่าน Accept/Edit ของผู้ใช้ก่อนเข้า decision state
13. ต้อง meter usage, มี hard limit และ cost guardrail แยกต่อ Project
14. Project Pass ครอบคลุมเฉพาะ AI ที่อยู่ภายใน CODESIGN ไม่รวม ChatGPT, Codex หรือบริการภายนอกที่ผู้ใช้เลือกใช้ต่อ
15. Stripe ทำผ่าน Supabase Edge Functions และ webhook เท่านั้น Secret ห้ามอยู่ใน frontend และเริ่มจาก Test Mode

## Lifecycle ของ Project Pass

`available → consumed`

`available → revoked → available`

- `available`: ใช้สร้าง Own Project ได้
- `consumed`: ใช้เปิด Project แล้ว ใช้ซ้ำไม่ได้ แม้ Project ถูกลบ
- `revoked`: Admin ระงับสิทธิ์ที่ยังไม่ถูกใช้
- `restore` ใน Phase 1 หมายถึง restore เฉพาะ Pass ที่ถูก revoke กลับเป็น available
- หากต้องชดเชย Pass ที่ consumed แล้ว ให้ Admin grant Pass ใหม่พร้อมเหตุผล ไม่แก้ประวัติเดิม

## Creation rules

1. ผู้ใช้ต้อง sign in
2. Frontend อ่านรายการ Pass ของผู้ใช้ได้ แต่แก้ status ไม่ได้
3. เมื่อกด Create ให้เรียก atomic RPC เท่านั้น
4. Frontend สร้าง `creationKey` เมื่อผู้ใช้ยืนยัน และ reuse key เดิมเมื่อ retry request เดิม
5. RPC lock Pass ที่ available หนึ่งแถว เลือกสิทธิ์ที่ grant ก่อน
6. RPC สร้าง Project ด้วย `mode = 'own'` และเปลี่ยน Pass เป็น `consumed`
7. หาก validation, insert หรือ consume ขั้นใดล้มเหลว transaction ต้องไม่เหลือ Project หรือ Pass ที่ถูกหักค้างไว้
8. Retry ด้วย `creationKey` เดิมต้องคืน Project เดิมโดยไม่หัก Pass เพิ่ม
9. Direct insert ของ `mode = 'own'` จาก browser ต้องถูก RLS ปฏิเสธ
10. Direct insert ของ Guided Project ยังคงทำงานแบบเดิม

## Human decision boundary

- AI output เริ่มต้นเป็น `proposed` เสมอ
- ผู้ใช้เลือกได้: Accept, Edit & Accept, Reject, Regenerate
- เฉพาะ Accept และ Edit & Accept เท่านั้นที่บันทึกเป็น decision ปัจจุบัน
- Regenerate ใช้ allowance เพิ่มและไม่ทับ accepted decision เดิม
- Cross-step consistency warning เป็นคำเตือน ไม่ใช่การเปลี่ยนคำตอบอัตโนมัติ
- การสร้าง PRD ต้องอ้างอิง accepted decisions เท่านั้น Draft ที่ยังไม่ accept ห้ามปะปน

## สิ่งที่ Project Pass ไม่ได้ให้

- เครดิตใน ChatGPT หรือ Codex
- API key สำหรับผู้ใช้
- ค่า hosting, database หรือ third-party service ของ App ที่ผู้ใช้สร้าง
- สิทธิ์ refund หรือ Pass ใหม่เมื่อผู้ใช้ลบ Project
- การรับประกันว่า AI output ถูกต้องหรือเป็น Product decision

## Compatibility rules

- ห้าม backfill หรือ consume Pass ให้ Guided Project เดิม
- ห้ามเปลี่ยน default ของ `projects.mode` จาก `guided`
- Journey service เดิมยังอ่าน Project ทั้งสอง mode ได้ แต่ copy/prompt ที่ผูกกับ 21 Days ต้องแยกก่อนเปิด Own UI จริง
- Project ID และ child records เดิมไม่เปลี่ยน
- Migration ต้องเพิ่มของใหม่และจำกัดเฉพาะ insert ของ `own`; RLS อื่นของ Guided คงเดิม

## Acceptance criteria ระดับ Product

- ผู้ใช้ไม่มี Pass สร้าง Own Project ไม่ได้
- ผู้ใช้มี Pass 1 สิทธิ์ กดยืนยันพร้อมกันหลายครั้งก็ได้ Own Project ไม่เกิน 1 Project
- Validation fail ไม่หัก Pass
- ลบ Own Project แล้ว Pass ยังเป็น consumed
- Retry request เดิมหลัง Project ถูกลบต้องไม่ใช้ Pass ใหม่
- ผู้ใช้เห็นเฉพาะ Pass ของตนเอง ส่วน Admin เห็นเพื่อ support ได้
- Guided Project ยังสร้าง ทำ Journey archive/restore/delete และ export ได้เหมือนเดิม
- AI ไม่เขียน accepted decision โดยไม่มี user action
- เมื่อถึง hard limit ระบบหยุดเรียก AI ก่อนส่ง request และยังให้ผู้ใช้แก้ไข/ส่งออกข้อมูลของตนเองได้

## Assumptions / decisions ที่ยังต้องตรวจสอบ

รายการต่อไปนี้เป็น decision gate ห้ามเดาค่าใน production:

- ราคา Project Pass, currency, tax และประเทศที่ขาย
- นโยบาย refund, dispute/chargeback และผลต่อ Pass/Project ที่สร้างไปแล้ว
- Pass มีวันหมดอายุหรือไม่
- AI allowance ต่อ Project: จำนวน request, input/output token และงบต้นทุนสูงสุด
- จุดเวลาและระบบต้นทางที่ยืนยันว่าเป็น “ผู้เรียนหลักสูตร” เพื่อ grant Course Project Pass
- ผู้ใช้เดิมก่อนเปิด v2 ได้ Course Project Pass หรือไม่
- Admin สามารถ revoke Pass ที่ consumed แล้วหรือไม่; Phase 1 ตั้งใจไม่อนุญาต
- Own Journey จะลด/เปลี่ยนคำแนะนำในแต่ละ CODESIGN step อย่างไร ต้องทำ content design แยกก่อนเปิดใช้
