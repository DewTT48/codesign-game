import { z } from 'zod'

export const createOwnProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'ใส่ชื่อ Project อย่างน้อย 2 ตัวอักษร')
    .max(120, 'ชื่อ Project ต้องไม่เกิน 120 ตัวอักษร'),
  topic: z
    .string()
    .trim()
    .min(2, 'อธิบายหัวข้ออย่างน้อย 2 ตัวอักษร')
    .max(80, 'หัวข้อต้องไม่เกิน 80 ตัวอักษร'),
  creationKey: z
    .string()
    .trim()
    .min(8, 'ไม่สามารถยืนยันรายการสร้าง Project นี้ได้')
    .max(200, 'รหัสยืนยันรายการยาวเกินไป'),
})

export type CreateOwnProjectInput = z.infer<typeof createOwnProjectSchema>
