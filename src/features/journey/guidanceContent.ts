import type { AppLanguage } from '../i18n/LanguageContext'
import type { PrdSource } from './journey.service'

export type FieldGuide = {
  question: string
  example: string
  avoid?: string
  why?: string
}

export type PhaseGuide = {
  headline: string
  principle: string
  hint: string
  chatGoal: string
  prompt: string
  followUps: string[]
  bringBack: string
}

type Localized<T> = Record<AppLanguage, T>
type ChatContext = Record<string, unknown>

const field = (
  thQuestion: string,
  enQuestion: string,
  thExample: string,
  enExample: string,
  thAvoid?: string,
  enAvoid?: string,
  thWhy?: string,
  enWhy?: string,
): Localized<FieldGuide> => ({
  th: { question: thQuestion, example: thExample, avoid: thAvoid, why: thWhy },
  en: { question: enQuestion, example: enExample, avoid: enAvoid, why: enWhy },
})

const fieldGuides: Record<string, Localized<FieldGuide>> = {
  'context.initialWho': field('นึกถึงคนหนึ่งกลุ่มที่คุณอยากช่วย เขาเป็นใครและกำลังเจออะไร?', 'Picture one primary group. Who are they and what are they dealing with?', 'คนทำงานที่อยากเริ่มเขียน Journal แต่มีเวลาเพียงวันละ 10 นาที', 'Busy professionals who want to journal but only have ten minutes a day', 'คำกว้าง ๆ เช่น ทุกคน หรือคนที่สนใจ', 'Broad answers such as everyone or anyone interested'),
  'context.initialOutcome': field('หลังใช้ครบ 21 วัน คุณอยากเห็นอะไรเปลี่ยนไปอย่างสังเกตได้?', 'After 21 days, what observable change should have happened?', 'เขียนบันทึกได้อย่างน้อย 14 วันและรู้ว่ารูปแบบใดช่วยให้เขียนต่อเนื่อง', 'They complete at least 14 entries and know what helps them stay consistent', 'คำกว้าง ๆ เช่น ดีขึ้น เก่งขึ้น หรือมีความสุขขึ้น', 'Vague outcomes such as improve, get better, or be happier'),
  'context.who': field('Primary user คือใคร ในสถานการณ์ใด และมีพฤติกรรมปัจจุบันอย่างไร?', 'Who is the primary user, in what situation, with what current behavior?', 'พนักงานใหม่ที่เครียดกับการปรับตัวและมักทบทวนวันก่อนนอนผ่านโทรศัพท์', 'New employees adjusting to work who reflect on their day on a phone before bed', 'การรวมผู้ใช้หลายกลุ่มที่มีเป้าหมายต่างกัน', 'Combining several audiences with different goals'),
  'context.goal': field('ผู้ใช้ต้องการไปถึงผลลัพธ์ใด ไม่ใช่แค่ใช้ Feature อะไร?', 'What outcome does the user want, independent of any feature?', 'สร้างนิสัยทบทวนวันทำงานอย่างสั้นและต่อเนื่อง', 'Build a short, sustainable work-reflection habit', 'เขียนว่าใช้ Dashboard, กดปุ่ม หรือรับ Notification', 'Describing a dashboard, button, or notification'),
  'context.success': field('มีหลักฐานอะไรที่บอกว่า Product ช่วยเขาได้จริง?', 'What evidence would show that the product genuinely helped?', 'ผู้ใช้ทำกิจกรรมอย่างน้อย 14 จาก 21 วันและอธิบายสิ่งที่เรียนรู้เกี่ยวกับตัวเองได้', 'The user completes at least 14 of 21 days and can name what they learned', 'ตัวชี้วัดที่วัดไม่ได้ เช่น ผู้ใช้ชอบ App', 'Unmeasurable statements such as users like the app'),
  'context.importantContext': field('ผู้ใช้จะใช้ App ที่ไหน เมื่อไร บนอุปกรณ์ใด และอยู่ในสภาพใด?', 'Where, when, on what device, and under what conditions will they use it?', 'ใช้บนมือถือช่วงก่อนนอน ขณะเหนื่อย และมีเวลาไม่เกิน 10 นาที', 'Used on a phone before bed, while tired, with no more than ten minutes', 'การอธิบาย Feature แทนบริบทการใช้งาน', 'Describing features instead of the usage context'),
  'context.constraints': field('ข้อจำกัดใดมีผลต่อสิ่งที่เราสามารถสร้างหรือคาดหวังจากผู้ใช้?', 'Which limits affect what can be built or expected from the user?', 'ต้องเป็น standalone web app, ไม่ต้องสมัครบัญชี และกิจกรรมต่อวันไม่เกิน 10 นาที', 'A standalone web app with no sign-up and activities under ten minutes', 'สิ่งที่เป็นเพียงความชอบด้านสีหรือสไตล์', 'Preferences about colors or style rather than real constraints'),
  'context.corrections': field('Chat เข้าใจอะไรผิด หรือคุณเปลี่ยนความคิดเรื่องใดหลังการสนทนา?', 'What did Chat misunderstand, or what did you change after the conversation?', 'เดิมคิดว่าผู้ใช้ต้องการแรงจูงใจ แต่พบว่าปัญหาหลักคือไม่รู้จะเขียนอะไร', 'I assumed motivation was the issue, but the real friction was not knowing what to write'),

  'options.name': field('ตั้งชื่อสั้น ๆ ที่ทำให้จำแนวทางนี้จากตัวเลือกอื่นได้', 'Give this direction a short name that distinguishes it from the others', 'Daily Reflection Coach', 'Daily Reflection Coach', 'ชื่อที่เป็นเพียงสีหรือสไตล์ เช่น Blue Version', 'Names based only on color or style, such as Blue Version'),
  'options.coreIdea': field('แนวทางนี้ช่วยให้ผู้ใช้ไปถึง Goal ด้วยกลไกหลักอะไร?', 'What core mechanism helps the user reach the goal in this direction?', 'ถามคำถามสะท้อนคิดหนึ่งชุดต่อวันและให้ผู้ใช้ย้อนดูรูปแบบที่เกิดซ้ำ', 'A daily reflection sequence that reveals recurring patterns', 'รายการ Feature ที่ยังไม่บอกแนวคิดหลัก', 'A feature list with no clear product mechanism'),
  'options.like': field('คุณค่าหรือข้อได้เปรียบที่สัมพันธ์กับ Context คืออะไร?', 'What benefit makes this direction fit the locked context?', 'เริ่มได้เร็วในวันที่เหนื่อยและไม่ต้องเรียนรู้ระบบซับซ้อน', 'Quick to begin on tired days with almost no learning curve'),
  'options.tradeoff': field('การเลือกแนวทางนี้ทำให้เราต้องยอมเสียหรือไม่ทำอะไร?', 'What do we give up by choosing this direction?', 'เนื้อหาอาจรู้สึกซ้ำและไม่เหมาะกับคนที่ต้องการคำแนะนำเชิงลึก', 'It may feel repetitive and may not suit users seeking deep coaching', 'เขียนเพียงว่าไม่มีข้อเสีย', 'Claiming there is no downside'),

  'debate.assumption': field('AI กำลังถือว่าอะไรเป็นจริง ทั้งที่เรายังไม่มีหลักฐาน?', 'What is AI treating as true without evidence?', 'ผู้ใช้พร้อมกลับมาใช้งานทุกวันโดยไม่ต้องมีสิ่งเตือน', 'Users will return every day without any reminder'),
  'debate.why': field('เหตุใดสมมติฐานนี้จึงไม่น่าเชื่อหรือเสี่ยงต่อ Product?', 'Why is this assumption doubtful or risky?', 'ผู้ใช้เป้าหมายเหนื่อยหลังเลิกงานและเคยเลิกใช้ habit app มาก่อน', 'The target user is tired after work and has abandoned habit apps before'),
  'debate.change': field('ถ้าสมมติฐานไม่จริง Direction หรือกติกาใดต้องเปลี่ยน?', 'If the assumption is false, what direction or rule must change?', 'ลดกิจกรรมให้จบใน 5 นาทีและทำให้กลับมาต่อได้โดยไม่เสีย progress', 'Keep activities under five minutes and allow seamless return without losing progress'),
  'debate.whatChanged': field('หลังท้าทายสมมติฐาน Direction เปลี่ยนอะไร และเพราะอะไร?', 'After challenging assumptions, what changed and why?', 'ยังใช้ Daily Reflection แต่ตัด streak pressure ออกเพราะขัดกับบริบทที่ผู้ใช้เหนื่อย', 'Keep daily reflection but remove streak pressure because it conflicts with the tired-user context'),

  'establish.direction': field('สรุป Product version นี้ในหนึ่งประโยค: ใคร ใช้อะไร เพื่อผลลัพธ์ใด?', 'Describe this version in one sentence: who uses what to achieve which outcome?', 'เว็บแอปสะท้อนคิด 21 วันสำหรับพนักงานใหม่ เพื่อสร้างนิสัยทบทวนงานวันละไม่เกิน 10 นาที', 'A 21-day reflection web app for new employees to build a ten-minute daily reflection habit'),
  'establish.mustHave': field('ถ้าตัดสิ่งนี้ออก Product จะยังช่วยให้ผู้ใช้บรรลุ Goal หลักได้หรือไม่?', 'If this is removed, can the product still deliver its core goal?', 'Daily prompt, saved response, progress overview', 'Daily prompt, saved response, progress overview', 'Nice-to-have หรือรายละเอียดตกแต่ง', 'Nice-to-haves or decorative details'),
  'establish.nonGoal': field('อะไรที่น่าสนใจแต่ตั้งใจไม่ทำใน Version แรก?', 'What attractive idea are you intentionally excluding from version one?', 'Social sharing, AI-generated coaching, account sync', 'Social sharing, AI-generated coaching, account sync', 'คำกว้าง ๆ เช่น Feature ที่ไม่จำเป็น', 'Vague phrases such as unnecessary features'),

  'spec.flow': field('เขียนเป็นการกระทำที่ผู้ใช้ทำตามลำดับ ตั้งแต่เริ่มจนเห็นผลลัพธ์', 'Write observable user actions in order, from entry to outcome', 'Open app → choose Day 1 → answer prompt → save → see progress', 'Open app → choose Day 1 → answer prompt → save → see progress', 'ชื่อหน้าจอที่ไม่บอกว่าผู้ใช้ทำอะไร', 'Screen names that do not describe user action'),
  'spec.screenName': field('ตั้งชื่อตามหน้าที่ของ Screen หรือ State', 'Name the screen or state by its job', 'Daily Activity', 'Daily Activity'),
  'spec.userSees': field('ผู้ใช้เห็นข้อมูล ข้อความ และสถานะสำคัญอะไร?', 'What essential information, text, and state does the user see?', 'Day number, prompt, saved-answer status, and progress', 'Day number, prompt, saved-answer status, and progress'),
  'spec.userCanDo': field('ผู้ใช้ทำ Action ใดได้จริงบน Screen นี้?', 'What actions can the user actually take on this screen?', 'Write, save, return to overview', 'Write, save, return to overview'),
  'spec.next': field('หลังแต่ละ Action ระบบตอบสนองหรือพาไปที่ใด?', 'How does the system respond, and where does the user go next?', 'Save locally, show confirmation, then return to progress', 'Save locally, show confirmation, then return to progress'),
  'spec.dayFields': field('หนึ่งวันต้องมีข้อมูลอะไรเพื่อแสดงกิจกรรมได้ครบ?', 'What fields are needed to render one complete day?', 'Day number, title, prompt, activity, reflection question', 'Day number, title, prompt, activity, reflection question'),
  'spec.browserState': field('ข้อมูลใดต้องยังอยู่หลัง Refresh หรือปิด Browser?', 'What must remain after refresh or browser close?', 'Completed days, saved responses, last visited day', 'Completed days, saved responses, last visited day'),
  'spec.contentSource': field('Codex จะได้รับเนื้อหาครบ 21 วันจากที่ใด ในรูปแบบอะไร?', 'Where will Codex receive all 21 days of content, and in what format?', 'แนบไฟล์ content.json ที่มี title, prompt และ activity ครบทุกวัน', 'A content.json file containing title, prompt, and activity for every day', 'บอกเพียงว่าให้ Codex สร้างเนื้อหาเอง', 'Simply asking Codex to invent all content'),
  'spec.customFeel': field('มีคำอธิบาย Character ที่ตัวเลือกด้านบนยังครอบคลุมไม่ครบหรือไม่?', 'Is there a character word not covered by the choices above?', 'Grounded, quietly optimistic', 'Grounded, quietly optimistic'),
  'spec.visualStyle': field('Interface ควรให้ความรู้สึกเหมือนอะไร โดยไม่อ้างแค่ชื่อแบรนด์อื่น?', 'What should the interface feel like without relying only on another brand?', 'Block-based learning journey with clear progress and tactile controls', 'Block-based learning journey with clear progress and tactile controls'),
  'spec.colorRole': field('สีนี้ใช้สื่อหน้าที่หรือสถานะอะไร ไม่ใช่เพียงระบุชื่อสี?', 'What job or state does this color communicate?', 'Deep blue for structure; orange only for the next primary action', 'Deep blue for structure; orange only for the next primary action'),
  'spec.background': field('พื้นหลังช่วยเรื่อง Focus, Contrast และ Character อย่างไร?', 'How should the background support focus, contrast, and character?', 'Dark blue grid with low contrast so content cards remain dominant', 'A low-contrast dark blue grid that keeps content cards dominant'),
  'spec.surface': field('Card และพื้นที่กรอกข้อมูลแยกจากพื้นหลังอย่างไร?', 'How do cards and input surfaces separate from the background?', 'Solid blue panels with bright borders and white input surfaces', 'Solid blue panels with bright borders and white input surfaces'),
  'spec.interactionTone': field('การกด สำเร็จ ผิดพลาด และรอควรรู้สึกอย่างไร?', 'How should actions, success, errors, and waiting feel?', 'Direct, encouraging, and never childish', 'Direct, encouraging, and never childish'),
  'spec.typography': field('ตัวอักษรต้องช่วยลำดับชั้นและการอ่านเนื้อหายาวอย่างไร?', 'How should typography support hierarchy and long-form reading?', 'Pixel display font for short headings; readable Thai sans-serif for guidance', 'Pixel display font for short headings; readable sans-serif for guidance'),
  'spec.visualRationale': field('เชื่อม Visual decisions กับ User, Goal และ Context ที่ Lock ไว้', 'Connect visual decisions to the locked user, goal, and context', 'โครงสร้างที่ชัดช่วยผู้ใช้ที่เหนื่อยรู้ว่าต้องทำอะไรต่อ โดยสีส้มใช้เฉพาะ Action สำคัญ', 'Clear structure helps tired users know what comes next; orange is reserved for key actions'),
  'spec.persistence': field('เมื่อกลับมา App ต้องกู้คืนข้อมูลและตำแหน่งใด?', 'What data and position must be restored on return?', 'Restore responses, completed days, and last open day from localStorage', 'Restore responses, completed days, and last open day from localStorage'),
  'spec.revisit': field('ผู้ใช้ย้อนดูวันก่อนหน้าได้หรือไม่ และแก้ไขได้แค่ไหน?', 'Can users revisit earlier days, and what may they change?', 'ย้อนดูได้ทุกวัน และแก้คำตอบได้จนกว่าจะจบโปรแกรม', 'All days remain viewable; answers are editable until program completion'),
  'spec.skip': field('ผู้ใช้ข้ามวันได้หรือไม่ ถ้าได้ Progress คิดอย่างไร?', 'Can users skip ahead, and how does that affect progress?', 'เปิดดูวันถัดไปได้ แต่ไม่นับว่าสำเร็จจนบันทึกคำตอบ', 'Future days may be viewed but count only after an answer is saved'),
  'spec.empty': field('ถ้าข้อมูล Required ว่าง ระบบแสดงอะไรและเก็บอะไร?', 'What happens when required content is empty?', 'ไม่บันทึก แสดงข้อความใกล้ช่อง และคงข้อความที่พิมพ์ไว้', 'Do not save; show an inline message and preserve the draft'),
  'spec.edit': field('การแก้วันที่เสร็จแล้วเปลี่ยนสถานะหรือเวลาอย่างไร?', 'How does editing a completed day affect its state?', 'แก้ได้โดยยังคงสถานะ Completed และอัปเดตเวลาล่าสุด', 'Editing preserves Completed status and updates the modified time'),
  'spec.reset': field('Reset ลบข้อมูลใด และต้องยืนยันก่อนหรือไม่?', 'Exactly what does reset remove, and is confirmation required?', 'ลบคำตอบและ progress ทั้งหมดหลังยืนยันสองขั้น แต่ไม่ลบเนื้อหา 21 วัน', 'Delete responses and progress after confirmation, but keep the 21-day content'),
  'spec.mobile': field('บนจอเล็ก Layout, Navigation และ Input ต้องเปลี่ยนอย่างไร?', 'How should layout, navigation, and input behavior change on small screens?', 'Cards become one column, actions remain thumb-reachable, and no horizontal scroll', 'Cards use one column, actions stay thumb-reachable, and horizontal scrolling is prevented'),
  'spec.acceptance': field('เขียนเป็นผลลัพธ์ที่คนอื่นตรวจได้ว่า Pass หรือ Fail', 'Write an observable result another person can mark pass or fail', 'User can save Day 1, refresh, and still see the saved answer', 'User can save Day 1, refresh, and still see the saved answer', 'คำว่าใช้งานง่าย สวย หรือทำงานดีโดยไม่มีเงื่อนไขทดสอบ', 'Words such as easy, beautiful, or works well without a test condition'),

  'implement.appUrl': field('ใส่ URL สาธารณะที่ผู้ทดสอบเปิดได้โดยไม่ใช้เครื่องของคุณ', 'Provide a public URL a tester can open without your computer', 'https://username.github.io/project/', 'https://username.github.io/project/'),
  'implement.repoUrl': field('ใส่ Repository ที่เป็น source ของ Build นี้ หากต้องการเก็บใน Journal', 'Provide the source repository for this build if it should appear in the Journal', 'https://github.com/username/project', 'https://github.com/username/project'),

  'feedback.expected': field('ก่อนดูผู้ใช้ คุณคาดว่าเขาจะทำอะไรเป็นลำดับแรก?', 'Before observing, what did you expect the user to do first?', 'อ่านคำอธิบาย เลือก Day 1 แล้วเริ่มพิมพ์ทันที', 'Read the intro, choose Day 1, and begin typing'),
  'feedback.actual': field('บันทึกเฉพาะสิ่งที่เห็นหรือได้ยินจริงตามลำดับ', 'Record only what you directly saw or heard, in sequence', 'เลื่อนผ่านคำอธิบาย กด Progress สองครั้ง แล้วถามว่าจะเริ่มตรงไหน', 'Skipped the intro, tapped Progress twice, then asked where to start', 'การเดาเหตุผล เช่น เขาสับสนเพราะไม่ตั้งใจอ่าน', 'Guessing motives, such as they were confused because they did not pay attention'),
  'feedback.stuck': field('จุดใดที่ผู้ใช้หยุด กดซ้ำ ย้อนกลับ หรือขอความช่วยเหลือ?', 'Where did the user pause, repeat, backtrack, or ask for help?', 'หยุดที่หน้ารวมวันเพราะ Day 1 ดูเหมือนข้อความมากกว่าปุ่ม', 'Paused on the day list because Day 1 looked like text rather than a button'),
  'feedback.worked': field('ส่วนใดผู้ใช้เข้าใจและทำได้โดยไม่ต้องอธิบาย?', 'What did the user understand and complete without explanation?', 'เข้าใจการบันทึกคำตอบและเห็นสถานะสำเร็จทันที', 'Understood saving and noticed the completed state immediately'),
  'feedback.important': field('Observation ใดกระทบ Goal หลักมากที่สุด?', 'Which observation has the greatest impact on the core goal?', 'ผู้ใช้หา Action เริ่มต้นไม่พบ จึงไปไม่ถึง Daily activity', 'The user could not find the starting action and never reached the daily activity'),

  'next.change': field('เลือกแก้ Behavior หรือ Friction เพียงหนึ่งเรื่อง', 'Choose one behavior or friction point to change', 'ทำให้ Day 1 เป็น primary action ที่เห็นได้ทันทีบนหน้าแรก', 'Make Day 1 an immediately visible primary action on the home screen', 'รายการหลาย Feature ในคำตอบเดียว', 'A list of several features in one answer'),
  'next.because': field('เชื่อมการเปลี่ยนแปลงกับหลักฐานจาก Feedback และ Goal', 'Connect the change to observed feedback and the product goal', 'ผู้ทดสอบทุกคนหยุดก่อนเริ่มกิจกรรม ทำให้ Goal หลักเกิดขึ้นไม่ได้', 'Every tester stopped before the activity, blocking the core goal'),
  'next.expected': field('หลังแก้แล้ว คุณคาดว่าจะเห็นพฤติกรรมใดที่ทดสอบได้?', 'After the change, what testable behavior should occur?', 'ผู้ทดสอบใหม่เริ่ม Day 1 ได้ภายใน 10 วินาทีโดยไม่ถาม', 'A new tester starts Day 1 within ten seconds without asking for help'),
}

export function getFieldGuide(language: AppLanguage, key?: string) {
  return key ? fieldGuides[key]?.[language] : undefined
}

const text = (value: unknown, fallback = '—') => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value) && value.length) {
    return value.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).join('\n- ')
  }
  return fallback
}

const sourceValue = (source: PrdSource, phase: keyof PrdSource, key: string) => text(source[phase]?.[key])

export function getPhaseGuide(
  language: AppLanguage,
  phase: string,
  source: PrdSource,
  current: ChatContext = {},
  projectTopic = '',
): PhaseGuide {
  const th = language === 'th'
  const topic = projectTopic || '______'
  const who = sourceValue(source, 'C', 'who')
  const goal = sourceValue(source, 'C', 'goal')
  const success = sourceValue(source, 'C', 'success')
  const context = sourceValue(source, 'C', 'importantContext')
  const constraints = sourceValue(source, 'C', 'constraints')
  const direction = sourceValue(source, 'E', 'direction')
  const mustHaves = sourceValue(source, 'E', 'mustHaves')
  const nonGoals = sourceValue(source, 'E', 'nonGoals')

  const guides: Record<string, Localized<PhaseGuide>> = {
    C: {
      th: {
        headline: "DON'T DESIGN YET.",
        principle: 'ก่อนคิดว่า App จะมี Feature อะไร ทำให้ชัดก่อนว่าคุณกำลังสร้างมันให้ใครและเพื่ออะไร',
        hint: 'นึกถึงผู้ใช้หลักหนึ่งกลุ่มในสถานการณ์จริง แล้วแยก Goal ของเขาออกจาก Feature ที่คุณอยากสร้าง',
        chatGoal: 'ให้ Chat ช่วยถามเพื่อทำให้ WHO · GOAL · SUCCESS · CONTEXT · CONSTRAINTS ชัด โดยยังไม่ออกแบบ App',
        prompt: `ผมกำลังออกแบบเว็บแอป “21 DAYS OF ${topic}”\n\nความคิดตั้งต้นของผม:\n- คนที่อยากช่วย: ${text(current.initialWho)}\n- สิ่งที่อยากให้เกิดขึ้นหลัง 21 วัน: ${text(current.initialOutcome)}\n\nตอนนี้ยังไม่ต้องเสนอ Feature, หน้าจอ หรือรูปแบบของ App\n\nช่วยถามผมทีละหนึ่งคำถาม เพื่อทำให้ 5 เรื่องนี้ชัดเจน:\n1. Primary user คือใคร\n2. เขาต้องการบรรลุอะไร\n3. เราจะรู้ได้อย่างไรว่าสำเร็จ\n4. เขาจะใช้ App ในบริบทใด\n5. มีข้อจำกัดอะไรที่สำคัญ\n\nถ้าคำตอบของผมกว้างหรือกำกวม ให้ถามต่อโดยไม่ตัดสินใจแทนผม เมื่อข้อมูลเพียงพอแล้วให้สรุปเป็น WHO / GOAL / SUCCESS / IMPORTANT CONTEXT / CONSTRAINTS และแยกคำถามที่ยังไม่มีคำตอบ`,
        followUps: ['คำตอบใดของผมยังกว้างเกินไป?', 'มี User หลายกลุ่มปนกันอยู่หรือไม่?', 'Success ข้อนี้สังเกตหรือวัดได้อย่างไร?'],
        bringBack: 'นำเฉพาะสรุป 5 หัวข้อกลับมากรอก ไม่ต้องคัดลอก Chat transcript',
      },
      en: {
        headline: "DON'T DESIGN YET.",
        principle: 'Before choosing features, clarify who this is for and what meaningful outcome it should create.',
        hint: 'Picture one primary user in a real situation, then separate their goal from the features you want to build.',
        chatGoal: 'Use Chat to clarify WHO · GOAL · SUCCESS · CONTEXT · CONSTRAINTS without designing the app yet.',
        prompt: `I am designing a web app called “21 DAYS OF ${topic}”.\n\nMy starting thoughts:\n- The person I want to help: ${text(current.initialWho)}\n- What I hope changes after 21 days: ${text(current.initialOutcome)}\n\nDo not suggest features, screens, or an app design yet.\n\nAsk me one question at a time to clarify:\n1. Primary user\n2. User goal\n3. Observable success\n4. Context of use\n5. Important constraints\n\nChallenge answers that are broad or ambiguous without deciding for me. When the context is clear, summarize it under WHO / GOAL / SUCCESS / IMPORTANT CONTEXT / CONSTRAINTS and list unresolved questions separately.`,
        followUps: ['Which of my answers is still too broad?', 'Am I mixing multiple user groups?', 'How could this success statement become observable?'],
        bringBack: 'Bring back only the five-part summary, not the full transcript.',
      },
    },
    O: {
      th: {
        headline: "DON'T FALL IN LOVE WITH THE FIRST IDEA.",
        principle: 'Problem เดียวสามารถกลายเป็น Product ได้หลายแบบ ก่อนเลือกต้องเห็นความแตกต่างและสิ่งที่ต้องแลก',
        hint: 'Direction ที่ต่างกันจริงต้องเปลี่ยนกลไกที่พาผู้ใช้ไปถึง Goal ไม่ใช่แค่เปลี่ยนสี ชื่อ หรือ Layout',
        chatGoal: 'สร้างอย่างน้อย 3 Product directions ที่แตกต่างกันจริงจาก Context ที่ Lock ไว้',
        prompt: `เรากำลังออกแบบ “21 DAYS OF ${topic}”\n\nLOCKED CONTEXT\nWHO: ${who}\nGOAL: ${goal}\nSUCCESS: ${success}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\n\nช่วยเสนอ Product direction อย่างน้อย 3 แบบที่ใช้กลไกต่างกันจริงในการพาผู้ใช้ไปถึง Goal ห้ามสร้างความต่างด้วยสี ชื่อ หรือรายละเอียดตกแต่งเท่านั้น\n\nสำหรับแต่ละ Direction ให้ระบุ OPTION NAME / CORE IDEA / WHAT WE LIKE / TRADE-OFF และอธิบายว่าเหมาะหรือขัดกับ Context ข้อใด โดยยังไม่เลือกผู้ชนะให้ผม`,
        followUps: ['ตัวเลือกใดคล้ายกันเกินไปและควรแตกต่างอย่างไร?', 'แต่ละทางเลือกต้องยอมเสียอะไร?', 'มี Direction ใดที่เรียบง่ายกว่านี้แต่ยังถึง Goal หรือไม่?'],
        bringBack: 'บันทึก 3+ Directions พร้อม Core idea, Benefit และ Trade-off แล้วเลือก Current favorite ด้วยเหตุผลของคุณเอง',
      },
      en: {
        headline: "DON'T FALL IN LOVE WITH THE FIRST IDEA.",
        principle: 'One problem can become several products. See the meaningful differences and trade-offs before choosing.',
        hint: 'A genuinely different direction changes how the user reaches the goal—not only color, naming, or layout.',
        chatGoal: 'Generate at least three genuinely different product directions from the locked context.',
        prompt: `We are designing “21 DAYS OF ${topic}”.\n\nLOCKED CONTEXT\nWHO: ${who}\nGOAL: ${goal}\nSUCCESS: ${success}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\n\nPropose at least three product directions that use meaningfully different mechanisms to reach the goal. Do not create superficial variation through color, naming, or decoration.\n\nFor each direction provide OPTION NAME / CORE IDEA / WHAT WE LIKE / TRADE-OFF and explain how it fits or conflicts with the locked context. Do not choose a winner for me.`,
        followUps: ['Which directions are still too similar?', 'What must be sacrificed in each option?', 'Is there a simpler direction that still reaches the goal?'],
        bringBack: 'Capture 3+ directions with core idea, benefit, and trade-off, then select your own current favorite.',
      },
    },
    D: {
      th: {
        headline: "AI SOUNDS CONFIDENT. THAT DOESN'T MAKE IT RIGHT.",
        principle: 'แยกสิ่งที่รู้จริงออกจากสิ่งที่ AI และทีมกำลังคาด ก่อนยอมรับ Direction',
        hint: 'มองหา Assumption เกี่ยวกับ Behavior, Motivation, เวลา อุปกรณ์ และความเต็มใจกลับมาใช้ซ้ำ',
        chatGoal: 'เปิดเผย Assumptions และ Failure modes ของ Direction ที่กำลังชอบ',
        prompt: `ช่วยทำหน้าที่เป็น Product challenger สำหรับ “21 DAYS OF ${topic}”\n\nLOCKED CONTEXT\nWHO: ${who}\nGOAL: ${goal}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\n\nOPTIONS ที่กำลังพิจารณา:\n${sourceValue(source, 'O', 'options')}\n\nอย่าเสนอ Feature ใหม่ ให้ระบุสมมติฐานเกี่ยวกับ User behavior, Motivation, Context และการกลับมาใช้ซ้ำ แยกเป็น KNOWN / ASSUMED / UNKNOWN พร้อมอธิบายว่า Product จะล้มเหลวอย่างไรถ้าแต่ละสมมติฐานไม่จริง แล้วถามผมว่าต้องการ Agree หรือ Challenge ข้อใด`,
        followUps: ['ข้อใดมีผลต่อ Product มากที่สุดแต่มีหลักฐานน้อยที่สุด?', 'ใครอาจไม่ใช้ Product ตามที่เราคาด?', 'Direction นี้จะล้มเหลวในบริบทใด?'],
        bringBack: 'เลือกอย่างน้อย 2 Assumptions ระบุ Agree/Challenge เหตุผล สิ่งที่ควรเปลี่ยน และสรุปว่า Direction เปลี่ยนหรือไม่',
      },
      en: {
        headline: "AI SOUNDS CONFIDENT. THAT DOESN'T MAKE IT RIGHT.",
        principle: 'Separate what is known from what AI and the team are assuming before accepting a direction.',
        hint: 'Look for assumptions about behavior, motivation, time, device, and willingness to return.',
        chatGoal: 'Expose assumptions and failure modes in the current favorite direction.',
        prompt: `Act as a product challenger for “21 DAYS OF ${topic}”.\n\nLOCKED CONTEXT\nWHO: ${who}\nGOAL: ${goal}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\n\nOPTIONS UNDER CONSIDERATION:\n${sourceValue(source, 'O', 'options')}\n\nDo not add features. Identify assumptions about user behavior, motivation, context, and repeat use. Separate KNOWN / ASSUMED / UNKNOWN, explain how the product could fail if each assumption is false, then ask which assumptions I agree with or challenge.`,
        followUps: ['Which high-impact assumption has the weakest evidence?', 'Who may not behave as expected?', 'In what context would this direction fail?'],
        bringBack: 'Capture at least two assumptions, your agree/challenge stance, reasons, changes, and whether the direction changed.',
      },
    },
    E: {
      th: {
        headline: 'EXPLORATION ENDS HERE.',
        principle: 'หยุดเพิ่ม Option แล้วตัดสินใจว่า Version แรกจะเป็นอะไรและจะไม่เป็นอะไร',
        hint: 'Must Have คือสิ่งที่ขาดแล้ว Goal หลักเกิดขึ้นไม่ได้ ส่วนสิ่งที่เพียงน่าสนใจให้ย้ายไป Non-goal',
        chatGoal: 'ตรวจ Scope เทียบกับ Locked Context โดยไม่เพิ่ม Feature ใหม่',
        prompt: `ช่วยตรวจ Product scope สำหรับ “21 DAYS OF ${topic}”\n\nWHO: ${who}\nGOAL: ${goal}\nSUCCESS: ${success}\nCONSTRAINTS: ${constraints}\nDIRECTION หลัง Debate: ${sourceValue(source, 'D', 'whatChanged')}\n\nScope ที่ผมกำลังคิด:\nWE ARE BUILDING: ${text(current.direction)}\nMUST HAVE: ${text(current.mustHaves)}\nNOT IN THIS VERSION: ${text(current.nonGoals)}\n\nใช้เกณฑ์เดียว: ถ้าตัดสิ่งนี้ออก ผู้ใช้ยังบรรลุ Goal หลักได้หรือไม่? ชี้สิ่งที่กว้าง ซ้ำ หรือเป็น Nice-to-have และช่วยตั้งคำถามให้ผมตัดสินใจ ห้ามเพิ่ม Feature ใหม่`,
        followUps: ['Must Have ข้อใดไม่เชื่อมกับ Goal?', 'ข้อใดควรรวมกันเป็น Product capability เดียว?', 'มี Non-goal ใดที่ควรระบุเพื่อป้องกัน scope creep?'],
        bringBack: 'กลับมาพร้อม Direction หนึ่งประโยค, Must Have 1–8 ข้อ และ Non-goal อย่างน้อย 2 ข้อ',
      },
      en: {
        headline: 'EXPLORATION ENDS HERE.',
        principle: 'Stop adding options and decide what version one is—and is not.',
        hint: 'A must-have is something whose removal breaks the core goal. Move merely attractive ideas to non-goals.',
        chatGoal: 'Review scope against locked context without adding new features.',
        prompt: `Review the product scope for “21 DAYS OF ${topic}”.\n\nWHO: ${who}\nGOAL: ${goal}\nSUCCESS: ${success}\nCONSTRAINTS: ${constraints}\nPOST-DEBATE DIRECTION: ${sourceValue(source, 'D', 'whatChanged')}\n\nCURRENT SCOPE:\nWE ARE BUILDING: ${text(current.direction)}\nMUST HAVE: ${text(current.mustHaves)}\nNOT IN THIS VERSION: ${text(current.nonGoals)}\n\nUse one test: if this item is removed, can the user still achieve the core goal? Identify broad, duplicate, or nice-to-have items and ask me questions so I decide. Do not add features.`,
        followUps: ['Which must-have does not connect to the goal?', 'Which items should be one capability?', 'Which non-goal would best prevent scope creep?'],
        bringBack: 'Return with a one-sentence direction, 1–8 must-haves, and at least two explicit non-goals.',
      },
    },
    S: {
      th: {
        headline: 'MAKE IT BUILDABLE.',
        principle: 'แปลง Product decisions ให้เป็น Flow, Behavior, Data และเกณฑ์ที่ผู้พัฒนาไม่ต้องเดา',
        hint: 'เขียนสิ่งที่สังเกตได้: ผู้ใช้เห็นอะไร ทำอะไร ระบบตอบอย่างไร และ App ต้องจำอะไร',
        chatGoal: 'ให้ Chat ทำหน้าที่ Reviewer ชี้เฉพาะจุดกำกวมโดยไม่เติม Product decisions ให้',
        prompt: `ตรวจ Specification ของ “21 DAYS OF ${topic}” ในฐานะ Product reviewer\n\nLOCKED DIRECTION: ${direction}\nMUST HAVE: ${mustHaves}\nNON-GOALS: ${nonGoals}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\n\nCURRENT SPECIFICATION\nFLOW: ${text(current.flowSteps)}\nSCREENS: ${text(current.screens)}\nDAY DATA: ${text(current.dayFields)}\nBROWSER STATE: ${text(current.browserState)}\nACCEPTANCE: ${text(current.acceptanceCriteria)}\n\nชี้เฉพาะจุดที่กำกวม ขัดกัน หรือทำให้ Codex ต้องเดา จัดกลุ่มเป็น FLOW / SCREEN BEHAVIOR / CONTENT & DATA / VISUAL RATIONALE / EDGE CASES / ACCEPTANCE CRITERIA ห้ามเติมคำตอบหรือ Feature ใหม่ ให้ถามคำถามที่ผมต้องตัดสินใจแทน`,
        followUps: ['ข้อใดอธิบายความตั้งใจแต่ยังทดสอบไม่ได้?', 'มี Screen ใดไม่มีทางเข้าออกที่ชัดเจน?', 'Codex ยังต้องเดากติกาใดเกี่ยวกับข้อมูลหรือสถานะ?'],
        bringBack: 'แก้เฉพาะ Specification ในจุดที่คุณตัดสินใจแล้ว และตรวจให้ Acceptance criteria เป็น Pass/Fail ได้',
      },
      en: {
        headline: 'MAKE IT BUILDABLE.',
        principle: 'Turn product decisions into flow, behavior, data, and criteria a builder does not have to guess.',
        hint: 'Write observable details: what users see, what they do, how the system responds, and what the app remembers.',
        chatGoal: 'Ask Chat to identify ambiguity without inventing product decisions.',
        prompt: `Review the specification for “21 DAYS OF ${topic}” as a product reviewer.\n\nLOCKED DIRECTION: ${direction}\nMUST HAVE: ${mustHaves}\nNON-GOALS: ${nonGoals}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\n\nCURRENT SPECIFICATION\nFLOW: ${text(current.flowSteps)}\nSCREENS: ${text(current.screens)}\nDAY DATA: ${text(current.dayFields)}\nBROWSER STATE: ${text(current.browserState)}\nACCEPTANCE: ${text(current.acceptanceCriteria)}\n\nIdentify ambiguity, conflict, or anything that makes Codex guess. Group findings under FLOW / SCREEN BEHAVIOR / CONTENT & DATA / VISUAL RATIONALE / EDGE CASES / ACCEPTANCE CRITERIA. Do not add answers or features; ask the questions I must decide.`,
        followUps: ['Which statements describe intent but cannot be tested?', 'Does any screen lack a clear entry or exit?', 'Which data or state rule would Codex still have to guess?'],
        bringBack: 'Update only the specification decisions you made and make every acceptance criterion pass/fail testable.',
      },
    },
    PRD: {
      th: {
        headline: 'MAKE EVERY DECISION VISIBLE.',
        principle: 'PRD ต้องสะท้อนการตัดสินใจที่คุณทำไว้ โดยไม่ให้ AI เติม Product rule ที่ขาดหาย',
        hint: 'อ่านเหมือนผู้พัฒนา: ทุกหัวข้อบอกสิ่งที่ต้องสร้างและเกณฑ์ตรวจรับได้หรือยัง?',
        chatGoal: 'Review ความชัดเจนและความครบถ้วนของ PRD โดยไม่เพิ่ม Feature หรือ Product decision ใหม่',
        prompt: `ช่วย Review PRD ของ “21 DAYS OF ${topic}” ด้านล่าง\n\n${text(current.markdown)}\n\nกติกา:\n- ห้ามเพิ่ม Feature, Product rule หรือ Solution ใหม่\n- ชี้ข้อความที่กำกวม ขัดกัน ทดสอบไม่ได้ หรือไม่มีหลักฐานจาก Context/Scope\n- แยกผลเป็น CLARIFY / CONFLICT / MISSING DECISION / TESTABILITY\n- สำหรับ MISSING DECISION ให้ตั้งคำถามที่มนุษย์ต้องตอบ ห้ามตอบแทน\n- ตรวจว่า Non-goals และ Acceptance criteria สอดคล้องกับ Scope`,
        followUps: ['ข้อใดทำให้ผู้พัฒนาสามารถตีความได้มากกว่าหนึ่งแบบ?', 'มี Product rule ใดปรากฏใน PRD แต่ไม่ได้มาจากการตัดสินใจก่อนหน้า?', 'Acceptance criterion ใดไม่สามารถตรวจแบบ Pass/Fail?'],
        bringBack: 'แก้ PRD draft เฉพาะจุดที่คุณตัดสินใจแล้ว จากนั้นอ่านอีกครั้งก่อน Lock',
      },
      en: {
        headline: 'MAKE EVERY DECISION VISIBLE.',
        principle: 'The PRD must reflect your decisions without letting AI invent missing product rules.',
        hint: 'Read it like a builder: does every section explain what to build and how to verify it?',
        chatGoal: 'Review PRD clarity and completeness without adding features or product decisions.',
        prompt: `Review the PRD for “21 DAYS OF ${topic}” below.\n\n${text(current.markdown)}\n\nRules:\n- Do not add features, product rules, or solutions.\n- Flag statements that are ambiguous, conflicting, untestable, or unsupported by context/scope.\n- Group findings under CLARIFY / CONFLICT / MISSING DECISION / TESTABILITY.\n- For MISSING DECISION, ask the human question; do not answer it.\n- Check that non-goals and acceptance criteria agree with scope.`,
        followUps: ['Which statement allows more than one implementation?', 'Did any product rule appear without a prior decision?', 'Which acceptance criterion cannot be marked pass or fail?'],
        bringBack: 'Edit only the decisions you have made, then reread the draft before locking it.',
      },
    },
    I: {
      th: {
        headline: 'YOU KNOW WHAT TO BUILD. NOW LET CODEX BUILD IT.',
        principle: 'Codex ตัดสินใจเรื่อง Implementation ได้ แต่ต้องไม่สร้าง Product decision สำคัญขึ้นมาเอง',
        hint: 'แนบ PRD ที่ Solidified เป็น source of truth และกำหนดให้ Codex หยุดถามเมื่อความกำกวมเปลี่ยน Product behavior',
        chatGoal: 'ส่งมอบ PRD ให้ Codex พร้อมขอบเขตอำนาจตัดสินใจที่ชัดเจน',
        prompt: `Implement แอป “21 DAYS OF ${topic}” ตาม PRD ที่ผมจะแนบให้ครบถ้วน\n\nกติกาการทำงาน:\n1. ใช้ PRD เป็น source of truth\n2. ตัดสินใจเรื่องโครงสร้างโค้ดและ implementation details ได้\n3. ห้ามเพิ่ม Feature ที่อยู่นอก Must Have\n4. ถ้าความกำกวมเปลี่ยน User flow, behavior, data rule หรือ acceptance criteria ให้หยุดและระบุ “PRODUCT DECISION REQUIRED” พร้อมตัวเลือกและผลกระทบ\n5. ทดสอบตาม Acceptance criteria และรายงานสิ่งที่ผ่าน/ไม่ผ่าน\n6. เตรียม deploy ผ่าน GitHub Pages\n\nก่อนเริ่ม ให้สรุปสิ่งที่จะสร้าง Non-goals และคำถามที่เป็น Product decision เท่านั้น`,
        followUps: ['มีจุดใดที่เป็น PRODUCT DECISION REQUIRED?', 'Acceptance criterion ใดยังไม่ผ่านและเพราะอะไร?', 'สิ่งที่สร้างเพิ่มทุกข้อเชื่อมกับ Must Have ข้อใด?'],
        bringBack: 'บันทึก Public App URL และ Repository URL หลัง Build ทำงานจริงและผ่านการ Preview',
      },
      en: {
        headline: 'YOU KNOW WHAT TO BUILD. NOW LET CODEX BUILD IT.',
        principle: 'Codex may decide implementation details, but it must not invent important product decisions.',
        hint: 'Attach the solidified PRD as the source of truth and require Codex to stop when ambiguity changes product behavior.',
        chatGoal: 'Hand off the PRD to Codex with explicit decision boundaries.',
        prompt: `Implement “21 DAYS OF ${topic}” completely from the PRD I will attach.\n\nWorking rules:\n1. Treat the PRD as the source of truth.\n2. Decide code structure and implementation details.\n3. Do not add features outside Must Have.\n4. If ambiguity changes user flow, behavior, data rules, or acceptance criteria, stop and label it “PRODUCT DECISION REQUIRED” with options and impact.\n5. Test against every acceptance criterion and report pass/fail.\n6. Prepare deployment to GitHub Pages.\n\nBefore building, summarize the build, non-goals, and only the questions that require a product decision.`,
        followUps: ['Is anything a PRODUCT DECISION REQUIRED?', 'Which acceptance criteria still fail, and why?', 'Which must-have supports each added element?'],
        bringBack: 'Save the public app URL and repository URL after the build works and has been previewed.',
      },
    },
    G: {
      th: {
        headline: 'TEST WHAT YOU BUILT, NOT WHAT YOU INTENDED.',
        principle: 'สังเกตสิ่งที่เกิดขึ้นจริงโดยไม่อธิบาย Interface หรือแก้ต่างแทนผู้ใช้',
        hint: 'เขียนสิ่งที่เห็นและได้ยินก่อนตีความ เช่น หยุด กดซ้ำ ย้อนกลับ หรือถามอะไร',
        chatGoal: 'จัดกลุ่ม Observation โดยแยกสิ่งที่ผู้ใช้ทำจริงออกจากการตีความและ Solution',
        prompt: `ช่วยจัดระเบียบผลทดสอบของ “21 DAYS OF ${topic}” โดยยังไม่เสนอ Solution\n\nI EXPECTED: ${text(current.expected)}\nTHEY ACTUALLY: ${text(current.actual)}\nSTUCK AT: ${text(current.stuck)}\nWORKED WELL: ${text(current.worked)}\nMOST IMPORTANT: ${text(current.mostImportant)}\n\nแยกเป็น 4 กลุ่ม:\n1. DIRECT OBSERVATION — สิ่งที่เห็นหรือได้ยินจริง\n2. INTERPRETATION — สิ่งที่ผมกำลังเดา\n3. EVIDENCE GAP — สิ่งที่ต้องทดสอบเพิ่ม\n4. GOAL IMPACT — Observation ใดกระทบ Goal หลักมากที่สุด\n\nห้ามเสนอ Feature หรือเลือกคำตอบแทนผม`,
        followUps: ['ประโยคใดเป็นการตีความมากกว่า Observation?', 'หลักฐานใดเกิดซ้ำมากกว่าหนึ่งครั้ง?', 'ปัญหาใดขวาง Goal หลัก ไม่ใช่แค่สร้างความรำคาญ?'],
        bringBack: 'แก้ข้อความให้เป็น Observation และเลือก Most important feedback เพียงหนึ่งประเด็น',
      },
      en: {
        headline: 'TEST WHAT YOU BUILT, NOT WHAT YOU INTENDED.',
        principle: 'Observe what actually happened without explaining the interface or defending it for the user.',
        hint: 'Record what you saw and heard before interpreting: pauses, repeated taps, backtracking, and questions.',
        chatGoal: 'Group observations while separating behavior from interpretation and solutions.',
        prompt: `Organize the test findings for “21 DAYS OF ${topic}” without proposing solutions.\n\nI EXPECTED: ${text(current.expected)}\nTHEY ACTUALLY: ${text(current.actual)}\nSTUCK AT: ${text(current.stuck)}\nWORKED WELL: ${text(current.worked)}\nMOST IMPORTANT: ${text(current.mostImportant)}\n\nSeparate them into:\n1. DIRECT OBSERVATION\n2. INTERPRETATION\n3. EVIDENCE GAP\n4. GOAL IMPACT\n\nDo not propose features or choose a priority for me.`,
        followUps: ['Which statement is interpretation rather than observation?', 'Which evidence appeared more than once?', 'Which issue blocks the core goal rather than merely causing annoyance?'],
        bringBack: 'Rewrite entries as observations and select one most important feedback point.',
      },
    },
    N: {
      th: {
        headline: "DON'T FIX EVERYTHING.",
        principle: 'เลือกการเปลี่ยนแปลงหนึ่งเรื่องที่พา Product เข้าใกล้ Goal มากที่สุด',
        hint: 'เลือก Behavior หรือ Friction ที่สังเกตและทดสอบผลได้ ไม่ใช้คำกว้าง ๆ เช่น make it better',
        chatGoal: 'ใช้ Feedback เพื่อจัดลำดับความสำคัญโดยไม่ให้ Chat เลือก Feature แทน',
        prompt: `ช่วยถามคำถามเพื่อจัดลำดับ Next iteration ของ “21 DAYS OF ${topic}”\n\nPRODUCT GOAL: ${goal}\nSUCCESS: ${success}\nMOST IMPORTANT FEEDBACK: ${text(current.mostImportant)}\nCURRENT CHANGE IDEA: ${text(current.change)}\nBECAUSE: ${text(current.because)}\nEXPECTED RESULT: ${text(current.expectedResult)}\n\nอย่าเสนอ Feature หรือเลือกคำตอบแทนผม ให้ตรวจว่า Change เชื่อมกับหลักฐานและ Goal หรือไม่ เล็กพอจะทำเป็นหนึ่ง Iteration หรือไม่ และ Expected result สังเกตได้หรือไม่ ถ้ายังไม่ชัดให้ถามผมทีละคำถาม`,
        followUps: ['ถ้าแก้ได้เรื่องเดียว อะไรปลดล็อก Goal มากที่สุด?', 'นี่เป็นปัญหาที่พบจริงหรือเป็นความชอบของทีม?', 'หลังแก้แล้วจะสังเกตพฤติกรรมอะไรที่ต่างออกไป?'],
        bringBack: 'Lock หนึ่ง Change พร้อม Because ที่อ้างอิง Feedback และ Expected result ที่ทดสอบได้',
      },
      en: {
        headline: "DON'T FIX EVERYTHING.",
        principle: 'Choose one change that moves the product closest to its core goal.',
        hint: 'Choose an observable behavior or friction point—not a broad intention such as make it better.',
        chatGoal: 'Use feedback to prioritize without letting Chat choose a feature for you.',
        prompt: `Ask me questions to prioritize the next iteration of “21 DAYS OF ${topic}”.\n\nPRODUCT GOAL: ${goal}\nSUCCESS: ${success}\nMOST IMPORTANT FEEDBACK: ${text(current.mostImportant)}\nCURRENT CHANGE IDEA: ${text(current.change)}\nBECAUSE: ${text(current.because)}\nEXPECTED RESULT: ${text(current.expectedResult)}\n\nDo not propose features or choose for me. Check whether the change connects to evidence and the goal, is small enough for one iteration, and has an observable expected result. If not, ask one question at a time.`,
        followUps: ['If only one issue could change, which best unlocks the goal?', 'Is this an observed problem or a team preference?', 'What behavior should be different after the change?'],
        bringBack: 'Lock one change with an evidence-based because and a testable expected result.',
      },
    },
  }

  return (guides[phase] ?? guides.C)[th ? 'th' : 'en']
}
