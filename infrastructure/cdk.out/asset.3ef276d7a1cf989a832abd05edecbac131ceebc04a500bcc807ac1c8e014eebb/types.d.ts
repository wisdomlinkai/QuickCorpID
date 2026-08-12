/**
 * QuickCorpID Auth Service - Type Definitions
 */
import { z } from 'zod';
export declare const SignUpRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    preferredLanguage: z.ZodDefault<z.ZodEnum<["en", "zh-HK"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName: string;
    preferredLanguage: "en" | "zh-HK";
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    fullName: string;
    phone?: string | undefined;
    preferredLanguage?: "en" | "zh-HK" | undefined;
}>;
export declare const SignInRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const UpdateProfileRequestSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    preferredLanguage: z.ZodOptional<z.ZodEnum<["en", "zh-HK"]>>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    phone?: string | undefined;
    preferredLanguage?: "en" | "zh-HK" | undefined;
}, {
    fullName?: string | undefined;
    phone?: string | undefined;
    preferredLanguage?: "en" | "zh-HK" | undefined;
}>;
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
export interface EnvironmentConfig {
    USER_POOL_ID: string;
    USER_POOL_CLIENT_ID: string;
    USER_POOL_CLIENT_SECRET?: string;
    DATABASE_SECRET_ARN: string;
    REGION: string;
    STAGE: string;
}
export declare const getEnvironmentConfig: () => EnvironmentConfig;
