/**
 * QuickCorpID Auth Service - Database Operations
 *
 * Handles user profile storage in Aurora PostgreSQL
 */
import { Client } from 'pg';
export declare function getDatabaseClient(): Promise<Client>;
export interface UserRecord {
    id: string;
    cognito_sub: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    preferred_language: 'en' | 'zh-HK';
    created_at: Date;
    updated_at: Date;
}
export declare function createUser(cognitoSub: string, email: string, fullName?: string, phone?: string, preferredLanguage?: 'en' | 'zh-HK'): Promise<UserRecord>;
export declare function getUserByCognitoSub(cognitoSub: string): Promise<UserRecord | null>;
export declare function getUserById(userId: string): Promise<UserRecord | null>;
export declare function updateUser(cognitoSub: string, updates: {
    fullName?: string;
    phone?: string;
    preferredLanguage?: 'en' | 'zh-HK';
}): Promise<UserRecord>;
export declare function initializeSchema(): Promise<void>;
