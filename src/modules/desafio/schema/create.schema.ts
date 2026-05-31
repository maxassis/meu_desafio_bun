import { z } from 'zod'

export const PurchaseDataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.string().min(1, 'Price is required'),
  priceId: z.string().min(1, 'Price ID is required'),
  rules: z.array(z.string()).min(1, 'At least one rule is required'),
  benefits: z.array(z.string()).min(1, 'At least one benefit is required'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  howParticipate: z.string().min(1, 'Participation instructions are required'),
})

const PurchaseDataInputSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  }
  catch {
    return value
  }
}, PurchaseDataSchema)

export const CreateDesafioMultipartSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  distance: z.coerce
    .number({ error: 'Distance must be a valid number' })
    .positive('Distance must be greater than zero'),
  active: z.coerce.boolean(),
  priceId: z.string().min(1, 'Price ID is required'),
  purchaseData: PurchaseDataInputSchema,
  images: z.unknown().optional(),
})

export type PurchaseData = z.infer<typeof PurchaseDataSchema>

export const CreateDesafioSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  distance: z.coerce
    .number({ error: 'Distance must be a valid number' })
    .positive('Distance must be greater than zero'),
  priceId: z.string().min(1, 'Price ID is required'),
  active: z.coerce.boolean(),
  purchaseData: PurchaseDataInputSchema,
  images: z.unknown().optional(),
})

export type CreateDesafioInput = z.infer<typeof CreateDesafioSchema>

export const CreateDesafioResponseSchema = z.object({
  message: z.string(),
  id: z.string(),
  imagesUploaded: z.number(),
  mainPhoto: z.string(),
  imageUrls: z.array(z.string()),
})

export type CreateDesafioResponse = z.infer<typeof CreateDesafioResponseSchema>
