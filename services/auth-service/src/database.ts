/**
 * QuickCorpID Auth Service - Database Operations
 * 
 * Handles user profile storage in Aurora PostgreSQL
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';

// ============================================================================
// Database Connection
// ============================================================================

interface DatabaseCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

let cachedCredentials: DatabaseCredentials | null = null;
let dbClient: Client | null = null;

async function getCredentials(secretArn: string): Promise<DatabaseCredentials> {
  if (cachedCredentials) return cachedCredentials;

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error('No secret value found');
  }

  cachedCredentials = JSON.parse(response.SecretString) as DatabaseCredentials;
  return cachedCredentials;
}

export async function getDatabaseClient(): Promise<Client> {
  if (dbClient) return dbClient;

  const secretArn = process.env.DATABASE_SECRET_ARN;
  if (!secretArn) {
    throw new Error('DATABASE_SECRET_ARN not set');
  }

  const credentials = await getCredentials(secretArn);

  dbClient = new Client({
    host: credentials.host,
    port: credentials.port,
    database: credentials.dbname,
    user: credentials.username,
    password: credentials.password,
    ssl: { rejectUnauthorized: false }, // For Aurora
  });

  await dbClient.connect();
  return dbClient;
}

// ============================================================================
// User Operations
// ============================================================================

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

export async function createUser(
  cognitoSub: string,
  email: string,
  fullName?: string,
  phone?: string,
  preferredLanguage: 'en' | 'zh-HK' = 'en'
): Promise<UserRecord> {
  const client = await getDatabaseClient();

  const result = await client.query<UserRecord>(
    `INSERT INTO users (cognito_sub, email, full_name, phone, preferred_language)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [cognitoSub, email, fullName || null, phone || null, preferredLanguage]
  );

  return result.rows[0];
}

export async function getUserByCognitoSub(cognitoSub: string): Promise<UserRecord | null> {
  const client = await getDatabaseClient();

  const result = await client.query<UserRecord>(
    'SELECT * FROM users WHERE cognito_sub = $1',
    [cognitoSub]
  );

  return result.rows[0] || null;
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const client = await getDatabaseClient();

  const result = await client.query<UserRecord>(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
}

export async function updateUser(
  cognitoSub: string,
  updates: {
    fullName?: string;
    phone?: string;
    preferredLanguage?: 'en' | 'zh-HK';
  }
): Promise<UserRecord> {
  const client = await getDatabaseClient();

  const setClauses: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;

  if (updates.fullName !== undefined) {
    setClauses.push(`full_name = $${paramIndex++}`);
    values.push(updates.fullName);
  }
  if (updates.phone !== undefined) {
    setClauses.push(`phone = $${paramIndex++}`);
    values.push(updates.phone);
  }
  if (updates.preferredLanguage !== undefined) {
    setClauses.push(`preferred_language = $${paramIndex++}`);
    values.push(updates.preferredLanguage);
  }

  if (setClauses.length === 0) {
    const existing = await getUserByCognitoSub(cognitoSub);
    if (!existing) throw new Error('User not found');
    return existing;
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(cognitoSub);

  const result = await client.query<UserRecord>(
    `UPDATE users SET ${setClauses.join(', ')} WHERE cognito_sub = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

// ============================================================================
// Database Schema Initialization
// ============================================================================

export async function initializeSchema(): Promise<void> {
  const client = await getDatabaseClient();

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cognito_sub VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      phone VARCHAR(50),
      preferred_language VARCHAR(10) DEFAULT 'en',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  console.log('Database schema initialized');
}
