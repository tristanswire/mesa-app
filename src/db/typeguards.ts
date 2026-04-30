import { z } from 'zod';

export const StepSegmentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), content: z.string() }),
  z.object({ type: z.literal('ingredient'), ingredientId: z.string() }),
  z.object({ type: z.literal('timer'), timerId: z.string() }),
]);

export const StepIngredientSchema = z.object({
  id: z.string(),
  display: z.string(),
});

export const StepTimerSchema = z.object({
  id: z.string(),
  label: z.string(),
  durationSeconds: z.number(),
});

export const StepSegmentsSchema = z.array(StepSegmentSchema);
export const StepIngredientsSchema = z.array(StepIngredientSchema);
export const StepTimersSchema = z.array(StepTimerSchema);

export type StepSegment = z.infer<typeof StepSegmentSchema>;
export type StepIngredient = z.infer<typeof StepIngredientSchema>;
export type StepTimer = z.infer<typeof StepTimerSchema>;
