import { z } from 'zod';

export const riskAssessmentAnswerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
    z.array(z.boolean())
  ])
});

export const riskAssessmentRequestSchema = z.object({
  answers: z.array(riskAssessmentAnswerSchema).min(1)
});

export type RiskAssessmentRequest = z.infer<typeof riskAssessmentRequestSchema>;
