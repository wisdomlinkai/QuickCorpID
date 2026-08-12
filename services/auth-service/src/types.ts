/**
 * QuickCorpID Auth Service - Type Definitions
 */

import { z } from 'zod';

// ============================================================================
// Request/Response Schemas
// ============================================================================

export const SignUpRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'zh-HK']).default('en'),
});

export const SignInRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'zh-HK']).optional(),
});

// ============================================================================
// Types
// ============================================================================

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface UserProfile {
  userId: string;
  email: string;
  fullName?: string;
  phone?: string;
  preferredLanguage: 'en' | 'zh-HK';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user?: UserProfile;
    tokens?: AuthTokens;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  pathParameters?: Record<string, string>;
  body?: string;
  requestContext: {
    authorizer?: {
      claims: {
        sub: string;
        email: string;
        'cognito:groups'?: string;
      };
    };
  };
}

export interface APIGatewayResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// ============================================================================
// Environment Configuration
// ============================================================================

export interface EnvironmentConfig {
  USER_POOL_ID: string;
  USER_POOL_CLIENT_ID: string;
  USER_POOL_CLIENT_SECRET?: string;
  DATABASE_SECRET_ARN: string;
  REGION: string;
  STAGE: string;
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    USER_POOL_ID: process.env.USER_POOL_ID || '',
    USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID || '',
    USER_POOL_CLIENT_SECRET: process.env.USER_POOL_CLIENT_SECRET,
    DATABASE_SECRET_ARN: process.env.DATABASE_SECRET_ARN || '',
    REGION: process.env.AWS_REGION || 'ap-southeast-1',
    STAGE: process.env.STAGE || 'dev',
  };
};
