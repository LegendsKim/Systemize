import { z } from 'zod';

export const contactRequestSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(320).toLowerCase(),
  message: z.string().min(10).max(5000).trim(),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;

export const contactRequestResponseSchema = z.object({
  status: z.enum(['success', 'duplicate', 'validation_error', 'rate_limited', 'error']),
  id: z.string().optional(),
  message: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
  retryAfterMs: z.number().optional(),
});
