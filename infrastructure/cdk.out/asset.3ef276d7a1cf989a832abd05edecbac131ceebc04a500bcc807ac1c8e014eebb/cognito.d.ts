/**
 * QuickCorpID Auth Service - Cognito Client
 *
 * Handles all Cognito Identity Provider operations
 */
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import type { EnvironmentConfig } from './types';
export declare function getCognitoClient(config: EnvironmentConfig): CognitoIdentityProviderClient;
export declare function signUp(email: string, password: string, fullName: string, config: EnvironmentConfig, phone?: string): Promise<{
    userSub: string;
    confirmed: boolean;
}>;
export declare function signIn(email: string, password: string, config: EnvironmentConfig): Promise<{
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
    challengeName?: string;
    challengeParameters?: Record<string, string>;
}>;
export declare function refreshTokens(refreshToken: string, config: EnvironmentConfig): Promise<{
    accessToken: string;
    idToken: string;
    expiresIn: number;
}>;
export declare function getUser(accessToken: string, config: EnvironmentConfig): Promise<{
    sub: string;
    email: string;
    name?: string;
    phone?: string;
}>;
export declare function updateUserAttributes(accessToken: string, attributes: {
    name?: string;
    phone?: string;
}, config: EnvironmentConfig): Promise<void>;
export declare function forgotPassword(email: string, config: EnvironmentConfig): Promise<void>;
export declare function confirmForgotPassword(email: string, confirmationCode: string, newPassword: string, config: EnvironmentConfig): Promise<void>;
export declare function signOut(accessToken: string, config: EnvironmentConfig): Promise<void>;
export declare function respondToAuthChallenge(session: string, challengeName: string, email: string, newPassword: string, config: EnvironmentConfig): Promise<{
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
}>;
