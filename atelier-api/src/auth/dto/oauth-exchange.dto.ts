import { z } from 'zod';

export const oauthExchangeSchema = z.object({
  code: z.string().min(1, 'Authorization code wajib diisi'),
});

export type OAuthExchangeDto = z.infer<typeof oauthExchangeSchema>;
