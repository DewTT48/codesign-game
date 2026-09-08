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

  'debate.assumption': field('Direction ที่เลือกกำลังตั้งอยู่บนสมมติฐานอะไรที่ยังไม่มีหลักฐานเพียงพอ?', 'What unproven assumption is the selected direction relying on?', 'ผู้ใช้พร้อมกลับมาใช้งานทุกวันโดยไม่ต้องมีสิ่งเตือน', 'Users will return every day without any reminder', 'คัดลอกทั้งคำอธิบาย Evidence หรือ Failure mode มารวมในช่องนี้', 'Copying the full evidence or failure-mode analysis into this field'),
  'debate.agreeReason': field('เหตุใดคุณจึงยอมรับความเสี่ยงนี้เป็น Working assumption เพื่อสร้างต่อ?', 'Why are you willing to accept this risk as a working assumption?', 'สอดคล้องกับพฤติกรรมที่เคยสังเกต และเราสามารถทดสอบกับผู้ใช้ได้ใน Version แรก', 'It matches behavior we have observed and can be tested with users in version one', 'ตอบเพียงว่า น่าจะใช่ หรือ AI บอกมา', 'Saying only probably or because AI said so'),
  'debate.challengeReason': field('เหตุใดคุณจึงเห็นว่าสมมติฐานนี้เสี่ยงหรือไม่ควรใช้เป็นฐานของ Product?', 'Why is this assumption too risky or unsuitable as a product foundation?', 'ผู้ใช้เป้าหมายเหนื่อยหลังเลิกงานและเคยเลิกใช้ Habit app มาก่อน', 'The target user is tired after work and has abandoned habit apps before', 'คัดลอกคำตอบ AI โดยไม่เพิ่มเหตุผลหรือประสบการณ์ของคุณ', 'Copying AI output without adding your own reasoning or experience'),
  'debate.change': field('ถ้าสมมติฐานไม่จริง Direction หรือกติกาใดต้องเปลี่ยน?', 'If the assumption is false, what direction or rule must change?', 'ลดกิจกรรมให้จบใน 5 นาทีและทำให้กลับมาต่อได้โดยไม่เสีย progress', 'Keep activities under five minutes and allow seamless return without losing progress'),
  'debate.whatChanged': field('หลังท้าทายสมมติฐาน Direction เปลี่ยนอะไร และเพราะอะไร?', 'After challenging assumptions, what changed and why?', 'ยังใช้ Daily Reflection แต่ตัด streak pressure ออกเพราะขัดกับบริบทที่ผู้ใช้เหนื่อย', 'Keep daily reflection but remove streak pressure because it conflicts with the tired-user context'),

  'establish.direction': field('สรุป Product version นี้ในหนึ่งประโยค: ใคร ใช้อะไร เพื่อผลลัพธ์ใด?', 'Describe this version in one sentence: who uses what to achieve which outcome?', 'เว็บแอปสะท้อนคิด 21 วันสำหรับพนักงานใหม่ เพื่อสร้างนิสัยทบทวนงานวันละไม่เกิน 10 นาที', 'A 21-day reflection web app for new employees to build a ten-minute daily reflection habit'),
  'establish.mustHave': field('ผู้ใช้ต้องทำอะไรใน Product นี้ จึงจะบรรลุ Goal หลัก?', 'What must the user do in this product to achieve the core goal?', 'ตอบ Daily prompt, บันทึกคำตอบ, ดูความคืบหน้า', 'Answer a daily prompt, save a response, view progress', 'Nice-to-have รายละเอียดตกแต่ง หรือสิ่งที่ไม่เชื่อมกับ Goal หลัก', 'Nice-to-haves, decoration, or anything not tied to the core goal', 'ระบุเฉพาะสิ่งที่ผู้ใช้จำเป็นต้องทำหรือได้รับ หากขาดสิ่งนี้ ผู้ใช้จะไปไม่ถึง Goal หลัก', 'Include only what the user must do or receive; without it, the user cannot reach the core goal'),
  'establish.nonGoal': field('เราจะยังไม่สร้างอะไรใน Version แรก แม้สิ่งนั้นจะน่าสนใจ?', 'What will we intentionally not build in version one, even if it is attractive?', 'Social sharing, AI-generated coaching, account sync', 'Social sharing, AI-generated coaching, account sync', 'คำกว้าง ๆ เช่น Feature ที่ไม่จำเป็น', 'Vague phrases such as unnecessary features'),

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

const cleanText = (value: string) => value.replace(/\\n/g, '\n').trim()

const promptLabel = (key: string) => key
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .toUpperCase()

const formatPromptObject = (value: Record<string, unknown>) => Object.entries(value)
  .map(([key, item]) => {
    const formatted = text(item, '')
    return formatted ? `${promptLabel(key)}: ${formatted}` : ''
  })
  .filter(Boolean)
  .join('\n')

const text = (value: unknown, fallback = '—'): string => {
  if (typeof value === 'string' && value.trim()) return cleanText(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value) && value.length) {
    const items = value
      .map((item, index) => {
        if (typeof item === 'string') {
          const formatted = cleanText(item)
          return formatted ? `${index + 1}. ${formatted}` : ''
        }
        if (item && typeof item === 'object') {
          const formatted = formatPromptObject(item as Record<string, unknown>)
          return formatted ? `ITEM ${String(index + 1).padStart(2, '0')}\n${formatted}` : ''
        }
        return item === null || item === undefined ? '' : `${index + 1}. ${String(item)}`
      })
      .filter(Boolean)
    return items.length ? items.join('\n\n') : fallback
  }
  if (value && typeof value === 'object') return formatPromptObject(value as Record<string, unknown>) || fallback
  return fallback
}

const sourceValue = (source: PrdSource, phase: keyof PrdSource, key: string) => text(source[phase]?.[key])

type PromptOption = {
  name?: unknown
  coreIdea?: unknown
  like?: unknown
  tradeoff?: unknown
}

const formatOption = (option: PromptOption, index: number, isFavorite: boolean) => [
  `OPTION ${String(index + 1).padStart(2, '0')}${isFavorite ? ' — CURRENT FAVORITE' : ''}`,
  `OPTION NAME: ${text(option.name)}`,
  `CORE IDEA: ${text(option.coreIdea)}`,
  `WHAT WE LIKE: ${text(option.like)}`,
  `TRADE-OFF: ${text(option.tradeoff)}`,
].join('\n')

const formatOptionsForPrompt = (source: PrdSource) => {
  const value = source.O?.options
  if (!Array.isArray(value) || value.length === 0) {
    return { favorite: '—', alternatives: '—' }
  }

  const options = value
    .filter((item) => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => item as PromptOption)
  const storedFavorite = Number(source.O?.favorite)
  const favoriteIndex = Number.isInteger(storedFavorite) && storedFavorite >= 0 && storedFavorite < options.length
    ? storedFavorite
    : 0

  return {
    favorite: formatOption(options[favoriteIndex] ?? {}, favoriteIndex, true),
    alternatives: options
      .map((option, index) => index === favoriteIndex ? '' : formatOption(option, index, false))
      .filter(Boolean)
      .join('\n\n') || '—',
  }
}

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
  const debateOptions = formatOptionsForPrompt(source)

  const guides: Record<string, Localized<PhaseGuide>> = {
    C: {
      th: {
        headline: 'ยังไม่ต้องออกแบบ',
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
        headline: 'อย่าเพิ่งหลงรักไอเดียแรก',
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
        headline: 'AI ฟังดูมั่นใจ ไม่ได้แปลว่าถูก',
        principle: 'แยกสิ่งที่รู้จริงออกจากสิ่งที่ AI และทีมกำลังคาด ก่อนยอมรับ Direction',
        hint: 'มองหา Assumption เกี่ยวกับ Behavior, Motivation, เวลา อุปกรณ์ และความเต็มใจกลับมาใช้ซ้ำ',
        chatGoal: 'เปิดเผย Assumptions และ Failure modes ของ Direction ที่กำลังชอบ',
        prompt: `ROLE\nทำหน้าที่เป็น Product Challenger สำหรับ “21 DAYS OF ${topic}”\n\nOBJECTIVE\nท้าทายสมมติฐานของ Current Favorite โดยเทียบกับ Locked Context ก่อนที่ผมจะยืนยัน Direction\n\nLOCKED CONTEXT\nWHO: ${who}\nGOAL: ${goal}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\n\nCURRENT FAVORITE — วิเคราะห์เป็นหลัก\n${debateOptions.favorite}\n\nALTERNATIVES — ใช้เปรียบเทียบเท่านั้น\n${debateOptions.alternatives}\n\nTASK\n1. ระบุสมมติฐานสำคัญ 3–5 ข้อเกี่ยวกับ User behavior, Motivation, Context, เวลา อุปกรณ์ และการกลับมาใช้ซ้ำ\n2. แยกแต่ละข้อเป็น KNOWN / ASSUMED / UNKNOWN\n3. อธิบาย Failure mode หากสมมติฐานนั้นไม่จริง\n4. จัดลำดับตาม Impact และ Evidence gap\n5. ตรวจว่าตัวเลือกอื่นลดความเสี่ยงนั้นได้หรือไม่ โดยไม่เลือก Direction แทนผม\n\nOUTPUT FORMAT\nสำหรับแต่ละข้อให้ใช้:\nASSUMPTION:\nSTATUS: KNOWN / ASSUMED / UNKNOWN\nEVIDENCE:\nFAILURE MODE:\nIMPACT: HIGH / MEDIUM / LOW\nQUESTION FOR OWNER:\n\nCONVERSATION RULES\n- ห้ามเสนอ Feature ใหม่\n- อย่าตัดสินใจ Agree หรือ Challenge แทนผม\n- หลังสรุป ให้เลือก 2 ข้อที่เป็น ASSUMED หรือ UNKNOWN ซึ่งสำคัญต่อ Direction มากที่สุด แล้วถามผมทีละหนึ่งข้อ\n- ช่วยผมอธิบายเหตุผลด้วยคำของผมเอง ไม่ใช้ข้อสรุปของ AI แทน\n- เมื่อผมตัดสินใจครบ 2 ข้อ ให้สรุป DEBATE HANDOFF เป็น DIRECTION ASSUMES THAT / OWNER STANCE / OWNER REASON / WHAT SHOULD CHANGE และปิดท้ายด้วย DIRECTION RESULT / WHAT CHANGED AND WHY`,
        followUps: ['ข้อใดมีผลต่อ Product มากที่สุดแต่มีหลักฐานน้อยที่สุด?', 'ใครอาจไม่ใช้ Product ตามที่เราคาด?', 'Direction นี้จะล้มเหลวในบริบทใด?'],
        bringBack: 'เลือกอย่างน้อย 2 Assumptions ระบุ Agree/Challenge เหตุผล สิ่งที่ควรเปลี่ยน และสรุปว่า Direction เปลี่ยนหรือไม่',
      },
      en: {
        headline: "AI SOUNDS CONFIDENT. THAT DOESN'T MAKE IT RIGHT.",
        principle: 'Separate what is known from what AI and the team are assuming before accepting a direction.',
        hint: 'Look for assumptions about behavior, motivation, time, device, and willingness to return.',
        chatGoal: 'Expose assumptions and failure modes in the current favorite direction.',
        prompt: `ROLE\nAct as a Product Challenger for “21 DAYS OF ${topic}”.\n\nOBJECTIVE\nChallenge the assumptions behind the Current Favorite against the Locked Context before I confirm the direction.\n\nLOCKED CONTEXT\nWHO: ${who}\nGOAL: ${goal}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\n\nCURRENT FAVORITE — analyze this primarily\n${debateOptions.favorite}\n\nALTERNATIVES — use for comparison only\n${debateOptions.alternatives}\n\nTASK\n1. Identify 3–5 important assumptions about user behavior, motivation, context, time, device, and repeat use.\n2. Classify each as KNOWN / ASSUMED / UNKNOWN.\n3. Explain the failure mode if the assumption is false.\n4. Prioritize by impact and evidence gap.\n5. Check whether an alternative reduces that risk without choosing a direction for me.\n\nOUTPUT FORMAT\nFor each item use:\nASSUMPTION:\nSTATUS: KNOWN / ASSUMED / UNKNOWN\nEVIDENCE:\nFAILURE MODE:\nIMPACT: HIGH / MEDIUM / LOW\nQUESTION FOR OWNER:\n\nCONVERSATION RULES\n- Do not propose new features.\n- Do not decide Agree or Challenge for me.\n- After the summary, select the 2 ASSUMED or UNKNOWN items most critical to the direction and ask me about them one at a time.\n- Help me express the reason in my own words rather than substituting an AI conclusion.\n- After both decisions, provide a DEBATE HANDOFF using DIRECTION ASSUMES THAT / OWNER STANCE / OWNER REASON / WHAT SHOULD CHANGE, followed by DIRECTION RESULT / WHAT CHANGED AND WHY.`,
        followUps: ['Which high-impact assumption has the weakest evidence?', 'Who may not behave as expected?', 'In what context would this direction fail?'],
        bringBack: 'Capture at least two assumptions, your agree/challenge stance, reasons, changes, and whether the direction changed.',
      },
    },
    E: {
      th: {
        headline: 'จบการสำรวจ ตัดสินใจให้ชัด',
        principle: 'หยุดเพิ่ม Option แล้วตัดสินใจว่า Version แรกจะเป็นอะไรและจะไม่เป็นอะไร',
        hint: 'กำหนดเฉพาะสิ่งที่ผู้ใช้ต้องทำเพื่อบรรลุ Goal หลัก ส่วนสิ่งที่น่าสนใจแต่ไม่จำเป็นให้ย้ายไป Non-goal',
        chatGoal: 'ตรวจว่าทุก Must Have รองรับสิ่งที่ผู้ใช้ต้องทำเพื่อบรรลุ Goal โดยไม่เพิ่ม Feature ใหม่',
        prompt: `ช่วยตรวจ Product scope สำหรับ “21 DAYS OF ${topic}”

WHO: ${who}
GOAL: ${goal}
SUCCESS: ${success}
CONSTRAINTS: ${constraints}
DIRECTION หลัง Debate: ${sourceValue(source, 'D', 'whatChanged')}

Scope ที่ผมกำลังคิด:
WE ARE BUILDING: ${text(current.direction)}
MUST HAVE: ${text(current.mustHaves)}
NOT IN THIS VERSION: ${text(current.nonGoals)}

เริ่มตรวจจากคำถามหลัก: ผู้ใช้ต้องทำอะไรใน Product นี้ จึงจะบรรลุ Goal หลัก?

สำหรับแต่ละ MUST HAVE:
1. ตรวจว่าเขียนเป็นการกระทำของผู้ใช้ หรือความสามารถที่ Product ต้องรองรับอย่างชัดเจนหรือไม่
2. อธิบายว่าข้อนั้นช่วยให้ผู้ใช้บรรลุ GOAL หรือ SUCCESS อย่างไร
3. ใช้คำถาม “ถ้าตัดข้อนี้ออก ผู้ใช้ยังบรรลุ Goal หลักได้ไหม?” เป็นเกณฑ์ตรวจ หากยังบรรลุได้ ให้เสนอว่าย้ายไป Nice-to-have หรือ NOT IN THIS VERSION

สำหรับ NOT IN THIS VERSION ให้ตรวจว่าเป็นสิ่งที่เราตั้งใจยังไม่สร้างใน Version แรกอย่างชัดเจนหรือไม่

ชี้รายการที่กว้าง ซ้ำ ไม่เชื่อมกับ Goal หรือเป็นเพียงรายละเอียดตกแต่ง แล้วถามผมทีละคำถามเพื่อให้ผมตัดสินใจ ห้ามเพิ่ม Feature ใหม่และห้ามตัดสินใจแทนผม`,
        followUps: ['ผู้ใช้ทำอะไรไม่ได้ถ้าตัด Must Have ข้อนี้ออก?', 'Must Have ข้อใดไม่ช่วยให้ผู้ใช้บรรลุ Goal?', 'ข้อใดควรรวมกันเป็น Product capability เดียว?', 'มี Non-goal ใดที่ควรระบุเพื่อป้องกัน scope creep?'],
        bringBack: 'กลับมาพร้อม Direction หนึ่งประโยค, Must Have 1–8 ข้อ และ Non-goal อย่างน้อย 2 ข้อ',
      },
      en: {
        headline: 'EXPLORATION ENDS HERE.',
        principle: 'Stop adding options and decide what version one is—and is not.',
        hint: 'Define only what the user must do to reach the core goal. Move attractive but unnecessary ideas to non-goals.',
        chatGoal: 'Check that every must-have supports what the user must do to reach the goal, without adding features.',
        prompt: `Review the product scope for “21 DAYS OF ${topic}”.

WHO: ${who}
GOAL: ${goal}
SUCCESS: ${success}
CONSTRAINTS: ${constraints}
POST-DEBATE DIRECTION: ${sourceValue(source, 'D', 'whatChanged')}

CURRENT SCOPE:
WE ARE BUILDING: ${text(current.direction)}
MUST HAVE: ${text(current.mustHaves)}
NOT IN THIS VERSION: ${text(current.nonGoals)}

Begin with this active question: What must the user do in this product to achieve the core goal?

For each MUST HAVE:
1. Check whether it clearly states a user action or a capability the product must support.
2. Explain how it helps the user achieve the GOAL or SUCCESS.
3. Use “If this is removed, can the user still achieve the core goal?” only as a validation test. If yes, suggest moving it to Nice-to-have or NOT IN THIS VERSION.

For NOT IN THIS VERSION, check whether it clearly states what we intentionally will not build in version one.

Identify items that are broad, duplicated, disconnected from the goal, or merely decorative. Ask me one question at a time so I decide. Do not add features or decide for me.`,
        followUps: ['What becomes impossible for the user if this must-have is removed?', 'Which must-have does not help the user reach the goal?', 'Which items should become one product capability?', 'Which non-goal would best prevent scope creep?'],
        bringBack: 'Return with a one-sentence direction, 1–8 must-haves, and at least two explicit non-goals.',
      },
    },
    S: {
      th: {
        headline: 'ทำให้พร้อมสร้างจริง',
        principle: 'กำหนด Journey, เนื้อหา และ Experience ที่ต้องการ แล้วให้ Chat ช่วยร่างรายละเอียดก่อนคุณตัดสินใจ',
        hint: 'คุณไม่ต้องออกแบบทุก Screen เอง ให้ตัดสินใจเฉพาะสิ่งที่เปลี่ยนประสบการณ์หรือผลลัพธ์ของผู้ใช้',
        chatGoal: 'ให้ AI ภายนอกช่วยร่าง Content Pack 21 วันและเสนอ Experience Direction โดยไม่เลือกแทน Product Owner',
        prompt: `ช่วยทำหน้าที่ Specification Co-designer สำหรับ “21 DAYS OF ${topic}”

Product Owner เป็นผู้ตัดสินใจ ส่วนคุณช่วยร่างรายละเอียดจากข้อมูลที่ Lock แล้ว ห้ามเพิ่ม Feature นอก MUST HAVE

LOCKED DIRECTION
${direction}

MUST HAVE
${mustHaves}

NOT IN THIS VERSION
${nonGoals}

USER CONTEXT
${context}

CONSTRAINTS
${constraints}

OWNER SPECIFICATION
PRODUCT LANGUAGE: ${text(current.productLanguage)}
BRAND COPY — DO NOT TRANSLATE: ${text(current.brandCopy)}
PRIMARY JOURNEY: ${text(current.journeySummary)}
ONE DAY IS COMPLETE WHEN: ${text(current.dailyCompletionRule)}
RETURN RULE: ${text(current.returnRule)}
DAY SEQUENCE: ${text(current.sequenceRule)}
SAVE BEHAVIOR: ${text(current.storageRule)}
TIME PER DAY: ${text(current.dailyDuration)}

CONTENT BLUEPRINT
CONTENT ARCS: ${text(current.contentArcs)}
DAILY CONTENT PATTERN: ${text(current.contentPattern)}
DAILY EXERCISE PATTERN: ${text(current.exercisePattern)}
DAILY RECORD PATTERN: ${text(current.recordPattern)}

วิธีทำงาน — ต้องทำตามลำดับและห้ามข้ามขั้น:

ขั้นที่ 1 — เสนอทางเลือกก่อนสร้างเนื้อหา
1. ยังไม่ต้องเขียนเนื้อหา 21 วัน และยังไม่ต้องสร้าง Markdown หรือไฟล์
2. เสนอ CONTENT EXPERIENCE DIRECTION จำนวน 3 แบบที่ต่างกันจริง แต่ละแบบต้องระบุ:
   - บทบาทหรือความสัมพันธ์กับผู้ใช้ เช่น เพื่อนร่วมทาง นักสำรวจ หรือโค้ชสะท้อนคิด โดยไม่จำเป็นต้องใช้อาจารย์
   - น้ำเสียงและความรู้สึก
   - จังหวะกิจกรรมประจำวัน
   - เหตุผลที่เข้ากับ Locked Direction
   - ข้อดีและ Trade-off
3. แนะนำได้ว่าแบบใดเหมาะที่สุดพร้อมเหตุผล แต่ห้ามเลือกแทน Product Owner
4. ถามให้ผมเลือกหนึ่งแบบ ผสมหลายแบบ หรือขอทางเลือกใหม่ แล้วรอคำตอบ

ขั้นที่ 2 — ปิดคำถามสำคัญ
5. หลังเลือก Direction แล้ว ตรวจเฉพาะความกำกวมที่เปลี่ยน Product behavior, เนื้อหาหลัก หรือผลลัพธ์ของผู้ใช้
6. หากต้องถาม ให้ถามทีละคำถาม ไม่เกิน 5 คำถามสำคัญ รายละเอียดมาตรฐานที่ย้อนแก้ได้ให้เสนอค่าแนะนำพร้อมป้าย AI RECOMMENDATION
7. หลังแต่ละคำตอบ ให้จำเฉพาะข้อสรุปที่ผมยอมรับแล้ว ห้ามถือว่า Recommendation ที่ยังไม่ยืนยันเป็นการตัดสินใจ

ขั้นที่ 3 — แสดงร่างให้อ่านและทำความเข้าใจก่อน
8. สรุป Owner Specification, Direction ที่เลือก, Content Arcs และ Daily Pattern เป็นภาษาคนอ่านก่อน
9. ร่างเนื้อหา 21 วันให้ตรวจทีละช่วง: DAY 01–07, DAY 08–14 และ DAY 15–21
10. ในแต่ละวันแสดง TITLE, OBJECTIVE, ใจความ CONTENT, EXERCISE, REFLECTION, RECORD, COMPLETION และ DURATION แบบอ่านง่าย ไม่ใช้ Code Block
11. หลังจบแต่ละช่วง ให้หยุดถามว่าต้องแก้อะไรก่อนทำช่วงถัดไป หากผมยังไม่ยืนยัน ห้ามถือว่าร่างผ่าน
12. จากนั้นเสนอ Experience/Theme 3 แบบที่ต่างกันจริง พร้อมสีที่มองเห็นเป็น Hex, Mood, Typography, Interaction, Rationale และ Trade-off แล้วให้ผมเลือกหรือแก้

ขั้นที่ 4 — ยืนยันร่างทั้งหมด
13. แสดง FINAL REVIEW สรุปสิ่งที่จะใส่ในไฟล์ ได้แก่ Owner Specification, เนื้อหา 21 วัน และ Theme ที่เลือก พร้อมรายการจุดที่ยังไม่ยืนยัน
14. ถ้ายังมีจุดที่ไม่ยืนยัน ให้ถามต่อและห้ามสร้างไฟล์
15. เมื่อทุกส่วนพร้อม ให้ขอให้ผมพิมพ์ “ยืนยันร่างทั้งหมด” ก่อน เมื่อผมยืนยันแล้ว ให้บอกว่าร่างพร้อมสร้างไฟล์ แต่ยังไม่ต้องสร้างไฟล์จนกว่าจะได้รับคำสั่งในขั้นที่ 5

ขั้นที่ 5 — สร้างไฟล์หลังได้รับคำสั่งเท่านั้น
16. สร้าง Markdown ตาม Template ด้านล่างเฉพาะเมื่อผมยืนยันร่างทั้งหมดแล้ว และพิมพ์ “สร้างไฟล์ CODESIGN_SPEC.md”
17. ห้ามสร้างไฟล์, Markdown Template ที่กรอกแล้ว หรือ Code Block ก่อนครบทั้งสองเงื่อนไข
18. ตอนสร้าง Markdown ห้ามเปลี่ยนชื่อหัวข้อหรือชื่อ Field

OWNER SPECIFICATION TEMPLATE — สรุปการตัดสินใจจากบทสนทนาเพื่อให้ CODESIGN เติมช่อง S1–S2:
<!-- CODESIGN:OWNER_SPEC:v1 -->
## OWNER SPECIFICATION
PRODUCT_LANGUAGE: th | en | bilingual
BRAND_COPY:
PRIMARY_JOURNEY:
ONE_DAY_COMPLETE_WHEN:
RETURN_RULE: allow-edit | read-only | no-revisit
DAY_SEQUENCE: sequential | allow-skip
SAVE_BEHAVIOR: browser-device | session-only
TIME_PER_DAY:
ARC_1_TITLE:
ARC_1_GOAL:
ARC_2_TITLE:
ARC_2_GOAL:
ARC_3_TITLE:
ARC_3_GOAL:
DAILY_CONTENT_PATTERN:
DAILY_EXERCISE_PATTERN:
DAILY_RECORD_PATTERN:

CONTENT PACK TEMPLATE — ทำให้ครบ DAY 01 ถึง DAY 21:
<!-- CODESIGN:CONTENT_PACK:v1 -->
## DAY 01
TITLE:
OBJECTIVE:
CONTENT:
EXERCISE:
REFLECTION:
RECORD:
COMPLETION:
DURATION:

EXPERIENCE TEMPLATE — เสนอ 3 แบบที่ต่างกันจริง:
<!-- CODESIGN:EXPERIENCE_DRAFT:v1 -->
## THEME OPTION 1
NAME:
MOOD:
BACKGROUND: #RRGGBB
SURFACE: #RRGGBB
PRIMARY: #RRGGBB
ACCENT: #RRGGBB
TEXT: #RRGGBB
TYPOGRAPHY:
INTERACTION:
RATIONALE:
TRADEOFF:

เนื้อหาต้องพร้อมใช้จริง ไม่ใส่ TODO และไม่ใช้ JSON

เมื่อได้รับคำสั่งสร้างไฟล์และสร้างครบทั้งสามส่วนแล้ว ให้สร้างไฟล์ชื่อ CODESIGN_SPEC.md สำหรับดาวน์โหลด หากระบบนี้สร้างไฟล์ไม่ได้ ให้แสดง Markdown ทั้งหมดใน Code Block เดียวเพื่อให้ผมคัดลอกกลับไปยัง CODESIGN`,
        followUps: ['เสนอ Content Experience Direction 3 แบบก่อน โดยยังไม่ต้องร่างเนื้อหา', 'แสดงร่างทีละ 7 วันและหยุดรอให้ฉันตรวจแต่ละช่วง', 'สรุปจุดที่ยังไม่ยืนยันก่อนขอให้ฉันยืนยันร่างทั้งหมด', 'หลังฉันยืนยันแล้ว รอคำสั่ง “สร้างไฟล์ CODESIGN_SPEC.md” ก่อนสร้างไฟล์'],
        bringBack: 'เลือก Direction และตรวจร่างทีละ 7 วันให้ครบ จากนั้นพิมพ์ “ยืนยันร่างทั้งหมด” และ “สร้างไฟล์ CODESIGN_SPEC.md” ตามลำดับ แล้วจึงนำไฟล์กลับมาอัปโหลดใน CODESIGN',
      },
      en: {
        headline: 'MAKE IT BUILDABLE.',
        principle: 'Define the journey, content, and intended experience. Let Chat draft detail before you decide.',
        hint: 'You do not need to design every screen. Decide only what changes user experience or outcomes.',
        chatGoal: 'Ask an external AI to draft the 21-day Content Pack and three Experience Directions without choosing for the Product Owner.',
        prompt: `Act as the Specification Co-designer for “21 DAYS OF ${topic}”.

The Product Owner makes decisions. You draft detail from locked information. Do not add features outside MUST HAVE.

LOCKED DIRECTION
${direction}

MUST HAVE
${mustHaves}

NOT IN THIS VERSION
${nonGoals}

USER CONTEXT
${context}

CONSTRAINTS
${constraints}

OWNER SPECIFICATION
PRODUCT LANGUAGE: ${text(current.productLanguage)}
BRAND COPY — DO NOT TRANSLATE: ${text(current.brandCopy)}
PRIMARY JOURNEY: ${text(current.journeySummary)}
ONE DAY IS COMPLETE WHEN: ${text(current.dailyCompletionRule)}
RETURN RULE: ${text(current.returnRule)}
DAY SEQUENCE: ${text(current.sequenceRule)}
SAVE BEHAVIOR: ${text(current.storageRule)}
TIME PER DAY: ${text(current.dailyDuration)}

CONTENT BLUEPRINT
CONTENT ARCS: ${text(current.contentArcs)}
DAILY CONTENT PATTERN: ${text(current.contentPattern)}
DAILY EXERCISE PATTERN: ${text(current.exercisePattern)}
DAILY RECORD PATTERN: ${text(current.recordPattern)}

Working method — follow these stages in order and never skip a stage:

STAGE 1 — OFFER DIRECTIONS BEFORE WRITING CONTENT
1. Do not write the 21-day content and do not generate Markdown or a file yet.
2. Offer three meaningfully different CONTENT EXPERIENCE DIRECTIONS. For each, explain:
   - the product's role or relationship with the user, such as companion, pathfinder, or reflective coach; it does not need to be a teacher
   - voice and feeling
   - daily activity rhythm
   - why it fits the Locked Direction
   - strengths and trade-offs
3. You may recommend one with reasons, but never choose for the Product Owner.
4. Ask me to select one, combine directions, or request new options. Wait for my answer.

STAGE 2 — RESOLVE HIGH-IMPACT QUESTIONS
5. After I choose a direction, ask only about ambiguity that materially changes product behavior, core content, or user outcomes.
6. Ask one question at a time, with no more than five high-impact questions. For reversible standard detail, offer a sensible default labeled AI RECOMMENDATION.
7. Retain only decisions I explicitly accept. Never treat an unaccepted recommendation as a decision.

STAGE 3 — SHOW A HUMAN-READABLE DRAFT FIRST
8. Summarize the Owner Specification, selected direction, Content Arcs, and Daily Pattern in plain language.
9. Draft the 21 days for review in three batches: DAY 01–07, DAY 08–14, and DAY 15–21.
10. For every day show TITLE, OBJECTIVE, CONTENT summary, EXERCISE, REFLECTION, RECORD, COMPLETION, and DURATION in a readable format without a code block.
11. After each batch, stop and ask what I want to change before continuing. Do not treat a batch as approved until I confirm it.
12. Then offer three meaningfully different Experience/Theme options with visible Hex colors, Mood, Typography, Interaction, Rationale, and Trade-off. Ask me to select or revise one.

STAGE 4 — CONFIRM THE COMPLETE DRAFT
13. Show a FINAL REVIEW of the Owner Specification, all 21 days, and selected Theme, plus a list of anything not yet approved.
14. If anything remains unapproved, continue the discussion and do not generate a file.
15. When everything is ready, ask me to type “APPROVE COMPLETE DRAFT”. After I approve, say the draft is ready for file creation, but do not create it until Stage 5.

STAGE 5 — CREATE THE FILE ONLY ON COMMAND
16. Generate the Markdown below only after I have approved the complete draft and typed “CREATE CODESIGN_SPEC.md”.
17. Do not produce the filled Markdown, a file, or a code block before both conditions are met.
18. When generating Markdown, preserve every heading and field name exactly.

OWNER SPECIFICATION TEMPLATE — summarize accepted decisions so CODESIGN can populate S1–S2:
<!-- CODESIGN:OWNER_SPEC:v1 -->
## OWNER SPECIFICATION
PRODUCT_LANGUAGE: th | en | bilingual
BRAND_COPY:
PRIMARY_JOURNEY:
ONE_DAY_COMPLETE_WHEN:
RETURN_RULE: allow-edit | read-only | no-revisit
DAY_SEQUENCE: sequential | allow-skip
SAVE_BEHAVIOR: browser-device | session-only
TIME_PER_DAY:
ARC_1_TITLE:
ARC_1_GOAL:
ARC_2_TITLE:
ARC_2_GOAL:
ARC_3_TITLE:
ARC_3_GOAL:
DAILY_CONTENT_PATTERN:
DAILY_EXERCISE_PATTERN:
DAILY_RECORD_PATTERN:

CONTENT PACK TEMPLATE — repeat for DAY 01 through DAY 21:
<!-- CODESIGN:CONTENT_PACK:v1 -->
## DAY 01
TITLE:
OBJECTIVE:
CONTENT:
EXERCISE:
REFLECTION:
RECORD:
COMPLETION:
DURATION:

EXPERIENCE TEMPLATE — provide three meaningfully different options:
<!-- CODESIGN:EXPERIENCE_DRAFT:v1 -->
## THEME OPTION 1
NAME:
MOOD:
BACKGROUND: #RRGGBB
SURFACE: #RRGGBB
PRIMARY: #RRGGBB
ACCENT: #RRGGBB
TEXT: #RRGGBB
TYPOGRAPHY:
INTERACTION:
RATIONALE:
TRADEOFF:

The content must be implementation-ready, contain no TODO markers, and must not use JSON.

After receiving the file-creation command and completing all three sections, create a downloadable file named CODESIGN_SPEC.md. If this system cannot create files, return the entire Markdown in one code block so I can paste it into CODESIGN.`,
        followUps: ['Offer three Content Experience Directions before drafting any content.', 'Show the draft in seven-day batches and pause for my review.', 'List anything not yet approved before asking me to approve the complete draft.', 'After approval, wait for “CREATE CODESIGN_SPEC.md” before generating the file.'],
        bringBack: 'Choose a direction and review all three seven-day batches. Then type “APPROVE COMPLETE DRAFT” and “CREATE CODESIGN_SPEC.md” in order before uploading the file into CODESIGN.',
      },
    },
    PRD: {
      th: {
        headline: 'ทำให้ทุกการตัดสินใจมองเห็นได้',
        principle: 'PRD ต้องสะท้อนการตัดสินใจที่คุณทำไว้ โดยไม่ให้ AI เติม Product rule ที่ขาดหาย',
        hint: 'ไฟล์ทั้ง 3 ฉบับถูกสร้างแล้ว ขั้นนี้ให้ตรวจความสอดคล้อง หากต้องเปลี่ยน Product decision ให้กลับไป Revision ที่ E หรือ S แทนการแก้เฉพาะไฟล์',
        chatGoal: 'ตรวจไฟล์ที่ CODESIGN ประกอบไว้แล้วทั้ง 3 ฉบับ และบอกทางต่อที่ถูกต้อง: ยืนยันไฟล์เดิม แก้เฉพาะไฟล์ หรือกลับไป Revision',
        prompt: `ช่วยตรวจชุดส่งต่องานของ “21 DAYS OF ${topic}” ในฐานะ Handoff reviewer\n\nสิ่งสำคัญ: Prompt นี้มี Locked Owner Decisions และไฟล์ร่างทั้ง 3 ฉบับอยู่แล้ว งานของคุณคือ Review ความสอดคล้อง ไม่ใช่สร้าง Product ใหม่จากศูนย์\n\n===== LOCKED OWNER DECISIONS — SOURCE OF TRUTH =====\nWHO: ${who}\nGOAL: ${goal}\nSUCCESS: ${success}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\nDIRECTION: ${direction}\nMUST HAVE: ${mustHaves}\nNOT IN THIS VERSION: ${nonGoals}\nPRIMARY JOURNEY: ${sourceValue(source, 'S', 'journeySummary')}\nONE DAY IS COMPLETE WHEN: ${sourceValue(source, 'S', 'dailyCompletionRule')}\nRETURN RULE: ${sourceValue(source, 'S', 'returnRule')}\nSEQUENCE RULE: ${sourceValue(source, 'S', 'sequenceRule')}\nSTORAGE RULE: ${sourceValue(source, 'S', 'storageRule')}\nPRODUCT LANGUAGE: ${sourceValue(source, 'S', 'productLanguage')}\n\n===== CODESIGN_HANDOFF.md =====\n${text(current.handoff)}\n\n===== CONTENT_PACK.md =====\n${text(current.contentPack)}\n\n===== EXPERIENCE_DIRECTION.md =====\n${text(current.experienceDirection)}\n\n===== REVIEW RULES =====\n1. อ่าน Locked Owner Decisions และทั้ง 3 ไฟล์ก่อนสรุป ห้าม Review เพียงไฟล์เดียว\n2. ให้ Locked Owner Decisions เป็น Source of truth หากไฟล์ไม่ตรงกับข้อมูลที่ Lock แล้ว ให้ถือว่าเป็น Assembly mismatch\n3. แยกความต่างด้านถ้อยคำที่ไม่เปลี่ยนความหมาย ออกจากความต่างที่ทำให้ผู้พัฒนาสร้าง Behavior ต่างกันจริง\n4. อ้างชื่อไฟล์และหัวข้อที่เกี่ยวข้อง ห้ามเดาที่มา เพิ่ม Feature, เพิ่ม Product rule หรือตัดสินใจแทนเจ้าของ Product\n5. START_WITH_CODEX.md ยังไม่อยู่ในขั้นนี้และห้ามสร้าง เพราะจะสร้างใน Step Implement หลังระบุความพร้อมเรื่อง GitHub\n\n===== FIRST RESPONSE — เลือกเพียงหนึ่งสถานะ =====\nA. READY TO LOCK\nใช้เมื่อไม่พบความขัดแย้งที่เปลี่ยน Product หรือการสร้าง ผู้ใช้ไม่ต้องอัปโหลดไฟล์ใหม่\n\nB. FILE UPDATE REQUIRED\nใช้เมื่อเป็น ASSEMBLY MISMATCH / TESTABILITY / EDITORIAL ONLY ที่แก้ไฟล์ให้ตรงกับ Owner Decisions เดิมได้ โดยไม่เพิ่มหรือเปลี่ยน Product decision\n\nC. REVISION REQUIRED — STEP E หรือ STEP S\nใช้เมื่อจำเป็นต้องเพิ่มหรือเปลี่ยน Product decision ห้ามแก้ให้จบเฉพาะในไฟล์ PRD\n- STEP E: ผู้ใช้หลัก, Goal, Direction, Must Have, Non-goal หรือขอบเขต Product\n- STEP S: Journey, กติกาแต่ละวัน, เนื้อหา 21 วัน, แบบฝึก, การบันทึก, Theme หรือ Experience\n\n===== CONVERSATION FLOW =====\n- เริ่มด้วย STATUS และเหตุผลสั้น ๆ\n- แสดงเฉพาะประเด็นที่กระทบการสร้างจริงสูงสุดไม่เกิน 3 ข้อ ไม่ต้องถามเรื่อง Editorial ที่แก้ให้ตรงกับข้อมูลเดิมได้\n- หากต้องถาม ให้ถามทีละหนึ่งคำถามและรอคำตอบ\n- หากเป็น READY TO LOCK ให้หยุดหลังสรุปและบอกให้กลับไปยืนยันไฟล์เดิมใน CODESIGN\n- หากเป็น REVISION REQUIRED ให้ระบุ Step E หรือ S พร้อมสิ่งที่ต้องกลับไปตัดสินใจ ห้ามสร้างไฟล์แก้ไข และรอให้ผู้ใช้กลับไปทำ Revision ใน CODESIGN\n- หากเป็น FILE UPDATE REQUIRED ให้สรุป EXACT EDITS แยกตามชื่อไฟล์และรอการยืนยัน\n- หลังผมยืนยันและพิมพ์ UPDATE HANDOFF FILES เท่านั้น ให้สร้างไฟล์ฉบับเต็มล่าสุดทั้ง 3 ไฟล์ชื่อ CODESIGN_HANDOFF.md, CONTENT_PACK.md และ EXPERIENCE_DIRECTION.md แม้บางไฟล์ไม่มีการเปลี่ยนแปลง\n- ห้ามย่อ ตัดหัวข้อ หรือเปลี่ยนชื่อไฟล์ หากสร้างไฟล์ดาวน์โหลดไม่ได้ ให้คืน Markdown ฉบับเต็มเป็น 3 code blocks ที่กำกับชื่อไฟล์ชัดเจน`,
        followUps: ['ถ้าไม่มีประเด็นที่เปลี่ยนการสร้าง ให้สรุป READY TO LOCK', 'ถ้าแก้ได้โดยไม่เปลี่ยน Product decision ให้สรุป FILE UPDATE REQUIRED', 'ถ้าต้องเปลี่ยนขอบเขตหรือรายละเอียด Product ให้ระบุ REVISION REQUIRED — STEP E หรือ STEP S'],
        bringBack: 'นำสถานะจาก Chat กลับมาเลือกใน CODESIGN หากเป็น FILE UPDATE REQUIRED ให้อัปโหลดไฟล์เต็มทั้ง 3 ฉบับ แต่หากเป็น REVISION REQUIRED ให้กลับไปแก้ Step E หรือ S ก่อน',
      },
      en: {
        headline: 'MAKE EVERY DECISION VISIBLE.',
        principle: 'The PRD must reflect your decisions without letting AI invent missing product rules.',
        hint: 'The three files already exist. Review consistency here; if a product decision must change, return to a revision in E or S instead of editing only the files.',
        chatGoal: 'Review the three assembled files and route the result correctly: keep the current files, update files only, or return to a revision.',
        prompt: `Review the handoff package for “21 DAYS OF ${topic}” as a Handoff reviewer.\n\nImportant: this prompt already includes the Locked Owner Decisions and all three draft files. Review their consistency; do not redesign the product from scratch.\n\n===== LOCKED OWNER DECISIONS — SOURCE OF TRUTH =====\nWHO: ${who}\nGOAL: ${goal}\nSUCCESS: ${success}\nCONTEXT: ${context}\nCONSTRAINTS: ${constraints}\nDIRECTION: ${direction}\nMUST HAVE: ${mustHaves}\nNOT IN THIS VERSION: ${nonGoals}\nPRIMARY JOURNEY: ${sourceValue(source, 'S', 'journeySummary')}\nONE DAY IS COMPLETE WHEN: ${sourceValue(source, 'S', 'dailyCompletionRule')}\nRETURN RULE: ${sourceValue(source, 'S', 'returnRule')}\nSEQUENCE RULE: ${sourceValue(source, 'S', 'sequenceRule')}\nSTORAGE RULE: ${sourceValue(source, 'S', 'storageRule')}\nPRODUCT LANGUAGE: ${sourceValue(source, 'S', 'productLanguage')}\n\n===== CODESIGN_HANDOFF.md =====\n${text(current.handoff)}\n\n===== CONTENT_PACK.md =====\n${text(current.contentPack)}\n\n===== EXPERIENCE_DIRECTION.md =====\n${text(current.experienceDirection)}\n\n===== REVIEW RULES =====\n1. Read the locked decisions and all three files before reporting. Never review only one file.\n2. Treat Locked Owner Decisions as the source of truth. A file that diverges from them is an assembly mismatch.\n3. Distinguish harmless wording differences from conflicts that would change the implemented behavior.\n4. Cite the affected filename and section. Do not invent features, product rules, or owner decisions.\n5. Do not create START_WITH_CODEX.md; it belongs to Implement after GitHub readiness is selected.\n\n===== FIRST RESPONSE — CHOOSE ONE STATUS =====\nA. READY TO LOCK\nUse when no conflict materially changes the product or build. No new upload is required.\n\nB. FILE UPDATE REQUIRED\nUse for ASSEMBLY MISMATCH / TESTABILITY / EDITORIAL ONLY issues that can be corrected to match existing owner decisions without changing the product.\n\nC. REVISION REQUIRED — STEP E or STEP S\nUse when a product decision must be added or changed. Do not resolve it only inside the PRD files.\n- STEP E: primary user, goal, direction, must-have, non-goal, or product scope\n- STEP S: journey, daily rules, 21-day content, exercises, records, theme, or experience\n\n===== CONVERSATION FLOW =====\n- Begin with one STATUS and a short reason.\n- Show no more than three material build-impact issues. Do not ask editorial questions that can be aligned to existing decisions.\n- Ask at most one owner question at a time and wait.\n- For READY TO LOCK, stop after the summary and tell me to confirm the current files in CODESIGN.\n- For REVISION REQUIRED, name Step E or S and the decision to revisit. Do not rewrite files; wait for me to complete the revision in CODESIGN.\n- For FILE UPDATE REQUIRED, list EXACT EDITS by filename and wait for approval.\n- Only after I approve and type UPDATE HANDOFF FILES, return complete current versions of CODESIGN_HANDOFF.md, CONTENT_PACK.md, and EXPERIENCE_DIRECTION.md, including unchanged files.\n- Do not shorten, omit sections, or rename files. If downloads are unavailable, return three complete fenced Markdown blocks labeled with the exact filenames.`,
        followUps: ['If nothing changes the build, return READY TO LOCK.', 'If existing decisions can resolve the issue, return FILE UPDATE REQUIRED.', 'If product scope or specification must change, return REVISION REQUIRED — STEP E or STEP S.'],
        bringBack: 'Choose the Chat status in CODESIGN. Upload all three complete files only for FILE UPDATE REQUIRED; for REVISION REQUIRED, return to Step E or S first.',
      },
    },
    I: {
      th: {
        headline: 'คุณรู้แล้วว่าจะสร้างอะไร ให้ Codex ลงมือสร้าง',
        principle: 'Codex ช่วยสร้าง App และพาใช้ GitHub ได้ แต่คุณยังเป็นผู้ยืนยัน Product decision และข้อมูลความปลอดภัยทุกครั้ง',
        hint: 'แนบ Handoff ทั้ง 4 ไฟล์ ถ้ายังไม่มี GitHub ให้บอก Codex ตรง ๆ ว่าต้องการคำอธิบายและให้พาทำทีละขั้น',
        chatGoal: 'ส่งมอบ Build Package ให้ Codex พร้อมระดับความพร้อมเรื่อง GitHub และขอบเขตอำนาจตัดสินใจ',
        prompt: `ช่วยสร้างแอป “21 DAYS OF ${topic}” จากไฟล์ Handoff 4 ไฟล์ที่ผมจะแนบ และพาผมทำงานทีละขั้นในฐานะผู้ใช้ Non-Tech\n\nGITHUB READINESS: ${text(current.githubReadiness)}\n\nกติกาการทำงาน:\n1. อ่าน CODESIGN_HANDOFF.md, CONTENT_PACK.md, EXPERIENCE_DIRECTION.md และ START_WITH_CODEX.md ให้ครบ\n2. ใช้ไฟล์เหล่านี้เป็น source of truth และห้ามเพิ่ม Feature นอก Must Have\n3. ตัดสินใจเรื่องโครงสร้างโค้ด Layout responsive และ implementation details ที่ไม่เปลี่ยน Product ได้\n4. ถ้าความกำกวมเปลี่ยน User, Journey, Content, Completion rule, Data behavior หรือ Experience direction ให้ระบุ “PRODUCT DECISION REQUIRED” และถามผมหนึ่งคำถาม\n5. อธิบาย GitHub, Repository และ GitHub Pages ด้วยภาษาง่าย ถ้าผมยังไม่มีบัญชี ให้พาเปิดบัญชีและสร้าง Repository ทีละขั้น\n6. ห้ามขอ Password, OTP, CAPTCHA, Recovery code หรือ 2FA secret ให้หยุดรอผมทำขั้นตอนความปลอดภัยเอง\n7. สร้าง App ให้ครบ 21 วัน ทดสอบ Desktop, Tablet, Mobile, Keyboard และการตัดคำภาษาไทย\n8. แสดง Preview ให้ผมตรวจ แล้วจึง Publish ผ่าน GitHub Pages\n\nก่อนเริ่ม ให้สรุปสิ่งที่จะสร้าง Non-goals ความพร้อม GitHub ของผม และคำถามที่เป็น Product decision เท่านั้น`,
        followUps: ['มีจุดใดที่เป็น PRODUCT DECISION REQUIRED จริง ๆ?', 'ช่วยอธิบายขั้นตอน GitHub ถัดไปด้วยภาษาสำหรับคนที่ไม่เคยใช้', 'Acceptance criterion ใดยังไม่ผ่านและเพราะอะไร?', 'ช่วยทดสอบ Mobile และการตัดคำภาษาไทยอีกครั้ง'],
        bringBack: 'บันทึก Public App URL และ Repository URL หลัง Build ทำงานจริงและผ่านการ Preview',
      },
      en: {
        headline: 'YOU KNOW WHAT TO BUILD. NOW LET CODEX BUILD IT.',
        principle: 'Codex can build the app and guide GitHub setup, while you confirm every product and security decision.',
        hint: 'Attach all four handoff files. If GitHub is new to you, ask Codex to explain and guide one step at a time.',
        chatGoal: 'Hand the Build Package to Codex with GitHub readiness and explicit decision boundaries.',
        prompt: `Build “21 DAYS OF ${topic}” from the four handoff files I will attach, guiding me step by step as a non-technical owner.\n\nGITHUB READINESS: ${text(current.githubReadiness)}\n\nRules:\n1. Read CODESIGN_HANDOFF.md, CONTENT_PACK.md, EXPERIENCE_DIRECTION.md, and START_WITH_CODEX.md.\n2. Treat them as the source of truth. Do not add features outside Must Have.\n3. Decide code structure, responsive layout, and implementation details that do not change the product.\n4. If ambiguity changes the user, journey, content, completion rule, data behavior, or experience direction, mark PRODUCT DECISION REQUIRED and ask one question.\n5. Explain GitHub, repositories, and GitHub Pages plainly; guide account and repository setup if needed.\n6. Never request passwords, OTPs, CAPTCHAs, recovery codes, or 2FA secrets. Pause while I complete security steps.\n7. Build all 21 days and test desktop, tablet, mobile, keyboard use, and text wrapping.\n8. Show me a preview before publishing through GitHub Pages.\n\nFirst summarize the build, non-goals, my GitHub readiness, and only genuine product-decision questions.`,
        followUps: ['Is anything genuinely PRODUCT DECISION REQUIRED?', 'Explain the next GitHub step for a first-time user.', 'Which acceptance criteria still fail, and why?', 'Retest mobile layout and text wrapping.'],
        bringBack: 'Save the public app URL and repository URL after the build works and has been previewed.',
      },
    },
    G: {
      th: {
        headline: 'ทดสอบสิ่งที่สร้าง ไม่ใช่สิ่งที่ตั้งใจ',
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
        headline: 'ไม่ต้องแก้ทุกอย่าง',
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
