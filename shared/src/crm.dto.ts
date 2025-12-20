import { z } from 'zod';

export const CreateLeadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional()
});

export const CreateKnowledgeSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type CreateKnowledgeInput = z.infer<typeof CreateKnowledgeSchema>;
