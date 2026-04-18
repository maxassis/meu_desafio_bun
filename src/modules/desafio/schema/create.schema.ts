import { z } from "zod";

export const DesafioRoutePointSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export const PurchaseDataSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.string().min(1, "Preço é obrigatório"),
  priceId: z.string().min(1, "PriceId é obrigatório"),
  rules: z.array(z.string()).min(1, "Pelo menos uma regra é obrigatória"),
  benefits: z.array(z.string()).min(1, "Pelo menos um benefício é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  shortDescription: z.string().min(1, "Descrição curta é obrigatória"),
  howParticipate: z.string().min(1, "Como participar é obrigatório"),
});

export type PurchaseData = z.infer<typeof PurchaseDataSchema>;

export const CreateDesafioSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  location: z.union([
    z.string().min(1, "Localização é obrigatória"),
    z.array(DesafioRoutePointSchema).min(1, "Localização é obrigatória"),
  ]),
  distance: z.string().min(1, "Distância é obrigatória"),
  priceId: z.string().min(1, "PriceId é obrigatório"),
  active: z.coerce.boolean(),
  purchaseData: z.union([
    z.string().min(1, "PurchaseData é obrigatória"),
    PurchaseDataSchema,
  ]),
  images: z.unknown().optional(),
});

export type CreateDesafioInput = z.infer<typeof CreateDesafioSchema>;

export const CreateDesafioResponseSchema = z.object({
  message: z.string(),
  id: z.string(),
  imagesUploaded: z.number(),
  mainPhoto: z.string(),
  imageUrls: z.array(z.string()),
});

export type CreateDesafioResponse = z.infer<typeof CreateDesafioResponseSchema>;