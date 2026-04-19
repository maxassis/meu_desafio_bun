import { z } from "zod";

export const CreateDesafioMultipartSchema = z.object({
  name: z.unknown(),
  location: z.unknown(),
  distance: z.unknown(),
  active: z.unknown(),
  priceId: z.unknown(),
  purchaseData: z.unknown(),
  images: z.unknown().optional(),
});

export const DesafioRoutePointSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export const PurchaseDataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  priceId: z.string().min(1, "Price ID is required"),
  rules: z.array(z.string()).min(1, "At least one rule is required"),
  benefits: z.array(z.string()).min(1, "At least one benefit is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().min(1, "Short description is required"),
  howParticipate: z.string().min(1, "Participation instructions are required"),
});

export type PurchaseData = z.infer<typeof PurchaseDataSchema>;

export const CreateDesafioSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.union([
    z.string().min(1, "Location is required"),
    z.array(DesafioRoutePointSchema).min(1, "Location is required"),
  ]),
  distance: z.string().min(1, "Distance is required"),
  priceId: z.string().min(1, "Price ID is required"),
  active: z.coerce.boolean(),
  purchaseData: z.union([
    z.string().min(1, "Purchase data is required"),
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
