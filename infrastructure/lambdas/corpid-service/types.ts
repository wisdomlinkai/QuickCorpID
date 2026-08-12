import { z } from 'zod';

// CorpID API Types
export const CorpIDConnectionStatusSchema = z.enum([
  'pending',
  'active',
  'expired',
  'revoked'
]);

export const CorpIDEnvironmentSchema = z.enum(['sandbox', 'production']);

export const CorpIDTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export const CorpIDUserInfoSchema = z.object({
  corp_id: z.string(),
  company_name: z.string(),
  br_number: z.string(),
  cr_number: z.string().optional(),
  authorised_representatives: z.array(z.object({
    name: z.string(),
    email: z.string(),
    role: z.string(),
  })).optional(),
});

export const CorpIDDocumentSchema = z.object({
  document_id: z.string(),
  document_type: z.string(),
  document_name: z.string(),
  created_at: z.string(),
  hash: z.string().optional(),
  signed: z.boolean().optional(),
});

// Database Types
export const CorpIDConnectionDBSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  corp_id: z.string(),
  status: CorpIDConnectionStatusSchema,
  access_token_encrypted: z.string().optional(),
  refresh_token_encrypted: z.string().optional(),
  token_expires_at: z.date().optional(),
  last_synced_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

// API Request Types
export const ConnectCorpIDRequestSchema = z.object({
  org_id: z.string().uuid(),
  environment: CorpIDEnvironmentSchema,
  auth_code: z.string().optional(),
  state: z.string().optional(),
});

export const GenerateQRCodeRequestSchema = z.object({
  org_id: z.string().uuid(),
  purpose: z.enum(['login', 'signing', 'document_wallet']),
  document_id: z.string().uuid().optional(),
  callback_url: z.string().url().optional(),
  expires_in_seconds: z.number().min(60).max(3600).default(300),
});

export const SyncDocumentWalletRequestSchema = z.object({
  org_id: z.string().uuid(),
  document_types: z.array(z.string()).optional(),
});

export const GetSigningStatusRequestSchema = z.object({
  org_id: z.string().uuid(),
  signing_request_id: z.string().uuid(),
});

export const InitiateSigningRequestSchema = z.object({
  org_id: z.string().uuid(),
  document_id: z.string().uuid(),
  signers: z.array(z.object({
    email: z.string().email(),
    name: z.string(),
    role: z.string().optional(),
  })),
  callback_url: z.string().url().optional(),
  expires_in_hours: z.number().min(1).max(168).default(72),
});

export const RefreshTokenRequestSchema = z.object({
  org_id: z.string().uuid(),
});

// API Response Types
export const CorpIDConnectionResponseSchema = z.object({
  connection_id: z.string().uuid(),
  corp_id: z.string(),
  company_name: z.string(),
  br_number: z.string(),
  cr_number: z.string().optional(),
  status: CorpIDConnectionStatusSchema,
  connected_at: z.string(),
});

export const QRCodeResponseSchema = z.object({
  qr_code_id: z.string().uuid(),
  qr_code_url: z.string(),
  deep_link: z.string().optional(),
  expires_at: z.string(),
  status: z.enum(['pending', 'scanned', 'completed', 'expired']),
});

export const SigningStatusResponseSchema = z.object({
  signing_request_id: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'completed', 'expired', 'cancelled']),
  signers: z.array(z.object({
    email: z.string(),
    name: z.string(),
    status: z.enum(['pending', 'signed', 'declined']),
    signed_at: z.string().optional(),
  })),
  completed_at: z.string().optional(),
  document_url: z.string().optional(),
});

// Type exports
export type CorpIDConnectionStatus = z.infer<typeof CorpIDConnectionStatusSchema>;
export type CorpIDEnvironment = z.infer<typeof CorpIDEnvironmentSchema>;
export type CorpIDTokenResponse = z.infer<typeof CorpIDTokenResponseSchema>;
export type CorpIDUserInfo = z.infer<typeof CorpIDUserInfoSchema>;
export type CorpIDDocument = z.infer<typeof CorpIDDocumentSchema>;
export type CorpIDConnectionDB = z.infer<typeof CorpIDConnectionDBSchema>;

export type ConnectCorpIDRequest = z.infer<typeof ConnectCorpIDRequestSchema>;
export type GenerateQRCodeRequest = z.infer<typeof GenerateQRCodeRequestSchema>;
export type SyncDocumentWalletRequest = z.infer<typeof SyncDocumentWalletRequestSchema>;
export type GetSigningStatusRequest = z.infer<typeof GetSigningStatusRequestSchema>;
export type InitiateSigningRequest = z.infer<typeof InitiateSigningRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export type CorpIDConnectionResponse = z.infer<typeof CorpIDConnectionResponseSchema>;
export type QRCodeResponse = z.infer<typeof QRCodeResponseSchema>;
export type SigningStatusResponse = z.infer<typeof SigningStatusResponseSchema>;
