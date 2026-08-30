import { ArrowLeft } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

const effectiveDate = '30 August 2026'

function LegalLayout({
  code,
  title,
  summary,
  children,
}: PropsWithChildren<{ code: string; title: string; summary: string }>) {
  return (
    <div className="content-page legal-page">
      <Link className="back-link" to="/"><ArrowLeft size={18} aria-hidden="true" /> CODESIGN HOME</Link>
      <header className="page-heading">
        <div><span className="chapter-code">{code}</span><h1>{title}</h1></div>
        <span className="mission-badge">EFFECTIVE {effectiveDate.toUpperCase()}</span>
      </header>
      <p className="legal-summary">{summary}</p>
      <article className="legal-document">{children}</article>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout code="DATA & PRIVACY" title="PRIVACY POLICY" summary="CODESIGN เก็บข้อมูลเท่าที่จำเป็นเพื่อให้ผู้ใช้เข้าสู่ระบบ บันทึก Product journey และกลับมาทำงานต่อได้">
      <section><h2>1. INFORMATION CODESIGN COLLECTS</h2><p>เมื่อคุณเข้าสู่ระบบด้วย Google, CODESIGN ได้รับชื่อ อีเมล รูปโปรไฟล์ และรหัสบัญชีพื้นฐานที่ Google อนุญาตให้ส่งผ่าน OAuth โดย CODESIGN ไม่ได้รับรหัสผ่าน Google ของคุณ</p><p>ระหว่างการใช้งาน เราเก็บข้อมูลที่คุณกรอกใน Project เช่น Context, Options, Decisions, Specification, PRD, URL ของ Build, Feedback และ Next Iteration</p></section>
      <section><h2>2. HOW THE INFORMATION IS USED</h2><ul><li>ยืนยันตัวตนและแยก Project ของผู้ใช้แต่ละคน</li><li>บันทึกและกู้คืน Guided Build journey</li><li>ประกอบ PRD และ CODESIGN Journal ตามการตัดสินใจของผู้ใช้</li><li>รักษาความปลอดภัยและแก้ปัญหาการทำงานของบริการ</li></ul></section>
      <section><h2>3. SERVICES THAT PROCESS DATA</h2><ul><li><strong>Google OAuth</strong> — ใช้สำหรับ Sign in และข้อมูลโปรไฟล์พื้นฐาน</li><li><strong>Supabase</strong> — ใช้สำหรับ Authentication และฐานข้อมูลส่วนตัว</li><li><strong>GitHub Pages</strong> — ใช้เผยแพร่ Frontend ของ CODESIGN</li></ul><p>ผู้ให้บริการเหล่านี้ประมวลผลข้อมูลตามนโยบายและเงื่อนไขของตนเอง</p></section>
      <section><h2>4. STORAGE & SECURITY</h2><p>ข้อมูล Project ถูกจัดเก็บใน Supabase และป้องกันด้วย Row Level Security เพื่อให้บัญชีที่เข้าสู่ระบบอ่านและแก้ไขได้เฉพาะข้อมูลของตนเอง Publishable key ที่อยู่ใน Frontend ไม่สามารถข้ามนโยบายนี้ได้</p></section>
      <section><h2>5. WHAT CODESIGN DOES NOT DO</h2><ul><li>ไม่ขายข้อมูลส่วนบุคคล</li><li>ไม่ใช้ข้อมูลเพื่อโฆษณาแบบเจาะจง</li><li>ไม่บันทึก Chat transcript ของผู้ใช้โดยอัตโนมัติ</li><li>ไม่ขอสิทธิ์เข้าถึง Google Drive, Gmail, Calendar หรือไฟล์ส่วนตัว</li></ul></section>
      <section><h2>6. RETENTION, ACCESS & DELETION</h2><p>ข้อมูลจะถูกเก็บเพื่อให้คุณกลับมาทำ Guided Build ต่อได้ คุณสามารถเพิกถอนการเชื่อมต่อ Google ได้จาก Google Account settings หากต้องการขอสำเนาหรือลบข้อมูล ให้ติดต่อผู้ดูแลผ่าน <a href="https://github.com/DewTT48/codesign-game/issues" target="_blank" rel="noreferrer">CODESIGN repository</a> โดยขอช่องทางติดต่อแบบส่วนตัวและอย่าโพสต์อีเมลหรือเนื้อหา Project ลงใน Public Issue</p></section>
      <section><h2>7. CHANGES</h2><p>หากวิธีเก็บหรือใช้ข้อมูลเปลี่ยนอย่างมีนัยสำคัญ หน้านี้จะถูกปรับปรุงพร้อม Effective date ใหม่</p></section>
    </LegalLayout>
  )
}

export function TermsPage() {
  return (
    <LegalLayout code="SERVICE RULES" title="TERMS OF USE" summary="เงื่อนไขนี้อธิบายขอบเขตการใช้ CODESIGN ในฐานะเครื่องมือเรียนรู้และจัดโครงสร้างการตัดสินใจด้าน Product">
      <section><h2>1. PURPOSE</h2><p>CODESIGN เป็นเครื่องมือการเรียนรู้ที่ช่วยเปลี่ยนไอเดียให้เป็น Product Definition, PRD และ Build journey ตัวระบบไม่รับประกันว่า Product หรือคำตัดสินใจใดถูกต้อง เหมาะสม หรือประสบความสำเร็จ</p></section>
      <section><h2>2. YOUR ACCOUNT & CONTENT</h2><p>คุณรับผิดชอบการรักษาความปลอดภัยของบัญชี Google ที่ใช้ Sign in และรับผิดชอบเนื้อหาที่คุณกรอก คุณควรหลีกเลี่ยงการบันทึกข้อมูลลับ ข้อมูลสุขภาพ ข้อมูลการเงิน หรือข้อมูลส่วนบุคคลของบุคคลอื่นที่ไม่จำเป็นต่อ Product journey</p></section>
      <section><h2>3. ACCEPTABLE USE</h2><p>ห้ามใช้ CODESIGN เพื่อฝ่าฝืนกฎหมาย ละเมิดสิทธิ์ของผู้อื่น พยายามเข้าถึง Project ของบัญชีอื่น รบกวนระบบ หรือเผยแพร่โค้ดและเนื้อหาที่เป็นอันตราย</p></section>
      <section><h2>4. EXTERNAL SERVICES</h2><p>CODESIGN ใช้ Google, Supabase และ GitHub Pages การใช้งานบางส่วนจึงขึ้นกับความพร้อมและเงื่อนไขของบริการเหล่านั้น ลิงก์ไปยัง App หรือ Repository ภายนอกเป็นเนื้อหาที่ผู้ใช้ระบุเอง</p></section>
      <section><h2>5. AVAILABILITY & CHANGES</h2><p>บริการอาจเปลี่ยน หยุดชั่วคราว หรือยุติได้ระหว่างการพัฒนา ผู้ใช้ควรดาวน์โหลด PRD และ Journal ที่สำคัญเพื่อเก็บสำเนาของตนเอง</p></section>
      <section><h2>6. RESPONSIBILITY</h2><p>คุณเป็นผู้ตัดสินใจว่าจะนำ PRD, Code หรือคำแนะนำจาก Chat/Codex ไปใช้อย่างไร CODESIGN สนับสนุนกระบวนการคิด แต่ไม่แทนที่การตรวจสอบของมนุษย์ การทดสอบ และคำแนะนำจากผู้เชี่ยวชาญเมื่อจำเป็น</p></section>
      <section><h2>7. CONTACT</h2><p>สำหรับคำถามเกี่ยวกับบริการหรือเงื่อนไขนี้ ให้ติดต่อผู้ดูแลผ่าน <a href="https://github.com/DewTT48/codesign-game/issues" target="_blank" rel="noreferrer">CODESIGN repository</a> และอย่าโพสต์ข้อมูลส่วนตัวหรือเนื้อหา Project ใน Public Issue</p></section>
    </LegalLayout>
  )
}
