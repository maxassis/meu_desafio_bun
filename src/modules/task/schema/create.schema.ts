import { z } from "zod";

export const CreateTaskSchema = z.object({
  name: z.string().min(1, "Nome da tarefa e obrigatorio"),
  environment: z.string().min(1, "Ambiente e obrigatorio"),
  date: z.union([z.string(), z.date()]).optional().nullable(),
  duration: z.coerce.number().nonnegative().default(0),
  calories: z.coerce.number().int().nonnegative().optional(),
  local: z.string().optional().nullable(),
  distance: z.coerce.number().nonnegative(),
  inscriptionId: z.coerce.number().int().positive(),
  gpsTask: z.coerce.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
