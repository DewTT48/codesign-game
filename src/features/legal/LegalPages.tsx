import { ArrowLeft } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

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
  const { isThai } = useLanguage()

  if (!isThai) {
    return (
      <LegalLayout code="DATA & PRIVACY" title="PRIVACY POLICY" summary="CODESIGN collects only the information needed for sign-in, saving your product journey, and continuing your work later.">
        <section><h2>1. INFORMATION CODESIGN COLLECTS</h2><p>When you sign in with Google, CODESIGN receives the name, email address, profile image, and basic account identifier that Google permits through OAuth. When you use an email Magic Link, CODESIGN receives your email address. CODESIGN never receives your Google or email password.</p><p>While you use the app, we store the information you enter in a project, including Context, Options, Decisions, Specification, PRD, build URLs, Feedback, and Next Iteration.</p></section>
        <section><h2>2. HOW THE INFORMATION IS USED</h2><ul><li>Authenticate you and keep each user&apos;s projects separate.</li><li>Save and restore your Guided Build journey.</li><li>Assemble the PRD and CODESIGN Journal from your decisions.</li><li>Maintain security and troubleshoot the service.</li></ul></section>
        <section><h2>3. SERVICES THAT PROCESS DATA</h2><ul><li><strong>Google OAuth</strong> — optional sign-in and basic profile information.</li><li><strong>Supabase</strong> — Google or email authentication and your private database records.</li><li><strong>GitHub Pages</strong> — hosting the CODESIGN frontend.</li></ul><p>These providers process information under their own policies and terms.</p></section>
        <section><h2>4. STORAGE & SECURITY</h2><p>Project data is stored in Supabase and protected by Row Level Security so a signed-in account can read and change only its own records. The publishable key in the frontend cannot bypass these policies.</p></section>
        <section><h2>5. WHAT CODESIGN DOES NOT DO</h2><ul><li>Sell personal information.</li><li>Use your information for targeted advertising.</li><li>Automatically store your Chat transcripts.</li><li>Request access to Google Drive, Gmail, Calendar, or private files.</li></ul></section>
        <section><h2>6. RETENTION, ACCESS & DELETION</h2><p>Information is retained so you can continue a Guided Build later. You can archive a mission from the Dashboard and permanently delete it from Archived missions. Deletion removes that mission and its related answers, decisions, PRD, and Journal. You can also revoke the Google connection in your Google Account settings. For account-level access or deletion requests, contact the administrator through the <a href="https://github.com/DewTT48/codesign-game/issues" target="_blank" rel="noreferrer">CODESIGN repository</a>, ask for a private contact channel, and do not post your email address or project content in a public issue.</p></section>
        <section><h2>7. CHANGES</h2><p>If how information is collected or used changes materially, this page will be updated with a new effective date.</p></section>
      </LegalLayout>
    )
  }

  return (
    <LegalLayout code="DATA & PRIVACY" title="PRIVACY POLICY" summary="CODESIGN เก็บข้อมูลเท่าที่จำเป็นเพื่อให้ผู้ใช้เข้าสู่ระบบ บันทึก Product journey และกลับมาทำงานต่อได้">
      <section><h2>1. INFORMATION CODESIGN COLLECTS</h2><p>เมื่อคุณเข้าสู่ระบบด้วย Google, CODESIGN ได้รับชื่อ อีเมล รูปโปรไฟล์ และรหัสบัญชีพื้นฐานที่ Google อนุญาตให้ส่งผ่าน OAuth ส่วนการเข้าสู่ระบบด้วย Email Magic Link ระบบจะได้รับอีเมลของคุณ โดย CODESIGN ไม่ได้รับรหัสผ่าน Google หรือรหัสผ่านอีเมลของคุณ</p><p>ระหว่างการใช้งาน เราเก็บข้อมูลที่คุณกรอกใน Project เช่น Context, Options, Decisions, Specification, PRD, URL ของ Build, Feedback และ Next Iteration</p></section>
      <section><h2>2. HOW THE INFORMATION IS USED</h2><ul><li>ยืนยันตัวตนและแยก Project ของผู้ใช้แต่ละคน</li><li>บันทึกและกู้คืน Guided Build journey</li><li>ประกอบ PRD และ CODESIGN Journal ตามการตัดสินใจของผู้ใช้</li><li>รักษาความปลอดภัยและแก้ปัญหาการทำงานของบริการ</li></ul></section>
      <section><h2>3. SERVICES THAT PROCESS DATA</h2><ul><li><strong>Google OAuth</strong> — เป็นทางเลือกสำหรับ Sign in และข้อมูลโปรไฟล์พื้นฐาน</li><li><strong>Supabase</strong> — ใช้สำหรับ Google หรือ Email Authentication และฐานข้อมูลส่วนตัว</li><li><strong>GitHub Pages</strong> — ใช้เผยแพร่ Frontend ของ CODESIGN</li></ul><p>ผู้ให้บริการเหล่านี้ประมวลผลข้อมูลตามนโยบายและเงื่อนไขของตนเอง</p></section>
      <section><h2>4. STORAGE & SECURITY</h2><p>ข้อมูล Project ถูกจัดเก็บใน Supabase และป้องกันด้วย Row Level Security เพื่อให้บัญชีที่เข้าสู่ระบบอ่านและแก้ไขได้เฉพาะข้อมูลของตนเอง Publishable key ที่อยู่ใน Frontend ไม่สามารถข้ามนโยบายนี้ได้</p></section>
      <section><h2>5. WHAT CODESIGN DOES NOT DO</h2><ul><li>ไม่ขายข้อมูลส่วนบุคคล</li><li>ไม่ใช้ข้อมูลเพื่อโฆษณาแบบเจาะจง</li><li>ไม่บันทึก Chat transcript ของผู้ใช้โดยอัตโนมัติ</li><li>ไม่ขอสิทธิ์เข้าถึง Google Drive, Gmail, Calendar หรือไฟล์ส่วนตัว</li></ul></section>
      <section><h2>6. RETENTION, ACCESS & DELETION</h2><p>ข้อมูลจะถูกเก็บเพื่อให้คุณกลับมาทำ Guided Build ต่อได้ คุณสามารถเก็บ Mission เข้าคลังจาก Dashboard และลบ Mission นั้นถาวรจากรายการ Archived การลบจะครอบคลุมคำตอบ การตัดสินใจ PRD และ Journal ที่เกี่ยวข้องทั้งหมด คุณยังสามารถเพิกถอนการเชื่อมต่อ Google ได้จาก Google Account settings หากต้องการเข้าถึงหรือลบข้อมูลระดับบัญชี ให้ติดต่อผู้ดูแลผ่าน <a href="https://github.com/DewTT48/codesign-game/issues" target="_blank" rel="noreferrer">CODESIGN repository</a> โดยขอช่องทางติดต่อแบบส่วนตัวและอย่าโพสต์อีเมลหรือเนื้อหา Project ลงใน Public Issue</p></section>
      <section><h2>7. CHANGES</h2><p>หากวิธีเก็บหรือใช้ข้อมูลเปลี่ยนอย่างมีนัยสำคัญ หน้านี้จะถูกปรับปรุงพร้อม Effective date ใหม่</p></section>
    </LegalLayout>
  )
}

export function TermsPage() {
  const { isThai } = useLanguage()

  if (!isThai) {
    return (
      <LegalLayout code="SERVICE RULES" title="TERMS OF USE" summary="These terms describe the scope of CODESIGN as a learning tool for structuring product decisions.">
        <section><h2>1. PURPOSE</h2><p>CODESIGN is a learning tool that helps turn an idea into a Product Definition, PRD, and build journey. It does not guarantee that any product or decision is correct, appropriate, or successful.</p></section>
        <section><h2>2. YOUR ACCOUNT & CONTENT</h2><p>You are responsible for securing the Google or email account used to sign in and for the content you enter. Avoid storing secrets, health or financial information, or another person&apos;s personal information unless it is necessary for the product journey.</p></section>
        <section><h2>3. ACCEPTABLE USE</h2><p>Do not use CODESIGN to break the law, infringe another person&apos;s rights, attempt to access another account&apos;s projects, disrupt the service, or distribute harmful code or content.</p></section>
        <section><h2>4. EXTERNAL SERVICES</h2><p>CODESIGN uses Google, Supabase, and GitHub Pages, so parts of the service depend on their availability and terms. Links to external apps or repositories are content supplied by the user.</p></section>
        <section><h2>5. AVAILABILITY & CHANGES</h2><p>The service may change, pause, or end during development. Download important PRDs and Journals to keep your own copies.</p></section>
        <section><h2>6. RESPONSIBILITY</h2><p>You decide how to use PRDs, code, and suggestions from Chat or Codex. CODESIGN supports your thinking process but does not replace human review, testing, or professional advice when needed.</p></section>
        <section><h2>7. CONTACT</h2><p>For questions about the service or these terms, contact the administrator through the <a href="https://github.com/DewTT48/codesign-game/issues" target="_blank" rel="noreferrer">CODESIGN repository</a>. Do not post personal information or project content in a public issue.</p></section>
      </LegalLayout>
    )
  }

  return (
    <LegalLayout code="SERVICE RULES" title="TERMS OF USE" summary="เงื่อนไขนี้อธิบายขอบเขตการใช้ CODESIGN ในฐานะเครื่องมือเรียนรู้และจัดโครงสร้างการตัดสินใจด้าน Product">
      <section><h2>1. PURPOSE</h2><p>CODESIGN เป็นเครื่องมือการเรียนรู้ที่ช่วยเปลี่ยนไอเดียให้เป็น Product Definition, PRD และ Build journey ตัวระบบไม่รับประกันว่า Product หรือคำตัดสินใจใดถูกต้อง เหมาะสม หรือประสบความสำเร็จ</p></section>
      <section><h2>2. YOUR ACCOUNT & CONTENT</h2><p>คุณรับผิดชอบการรักษาความปลอดภัยของบัญชี Google หรือบัญชีอีเมลที่ใช้ Sign in และรับผิดชอบเนื้อหาที่คุณกรอก คุณควรหลีกเลี่ยงการบันทึกข้อมูลลับ ข้อมูลสุขภาพ ข้อมูลการเงิน หรือข้อมูลส่วนบุคคลของบุคคลอื่นที่ไม่จำเป็นต่อ Product journey</p></section>
      <section><h2>3. ACCEPTABLE USE</h2><p>ห้ามใช้ CODESIGN เพื่อฝ่าฝืนกฎหมาย ละเมิดสิทธิ์ของผู้อื่น พยายามเข้าถึง Project ของบัญชีอื่น รบกวนระบบ หรือเผยแพร่โค้ดและเนื้อหาที่เป็นอันตราย</p></section>
      <section><h2>4. EXTERNAL SERVICES</h2><p>CODESIGN ใช้ Google, Supabase และ GitHub Pages การใช้งานบางส่วนจึงขึ้นกับความพร้อมและเงื่อนไขของบริการเหล่านั้น ลิงก์ไปยัง App หรือ Repository ภายนอกเป็นเนื้อหาที่ผู้ใช้ระบุเอง</p></section>
      <section><h2>5. AVAILABILITY & CHANGES</h2><p>บริการอาจเปลี่ยน หยุดชั่วคราว หรือยุติได้ระหว่างการพัฒนา ผู้ใช้ควรดาวน์โหลด PRD และ Journal ที่สำคัญเพื่อเก็บสำเนาของตนเอง</p></section>
      <section><h2>6. RESPONSIBILITY</h2><p>คุณเป็นผู้ตัดสินใจว่าจะนำ PRD, Code หรือคำแนะนำจาก Chat/Codex ไปใช้อย่างไร CODESIGN สนับสนุนกระบวนการคิด แต่ไม่แทนที่การตรวจสอบของมนุษย์ การทดสอบ และคำแนะนำจากผู้เชี่ยวชาญเมื่อจำเป็น</p></section>
      <section><h2>7. CONTACT</h2><p>สำหรับคำถามเกี่ยวกับบริการหรือเงื่อนไขนี้ ให้ติดต่อผู้ดูแลผ่าน <a href="https://github.com/DewTT48/codesign-game/issues" target="_blank" rel="noreferrer">CODESIGN repository</a> และอย่าโพสต์ข้อมูลส่วนตัวหรือเนื้อหา Project ใน Public Issue</p></section>
    </LegalLayout>
  )
}
