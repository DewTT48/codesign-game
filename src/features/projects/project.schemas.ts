import { z } from 'zod'

export const createProjectSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(2, 'ใส่หัวข้ออย่างน้อย 2 ตัวอักษร')
    .max(80, 'หัวข้อต้องไม่เกิน 80 ตัวอักษร'),
  contentReadiness: z.enum(['ready', 'some', 'idea']),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
