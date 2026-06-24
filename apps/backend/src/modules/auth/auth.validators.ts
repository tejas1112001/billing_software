import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});
