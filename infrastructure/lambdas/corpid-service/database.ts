import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { CorpIDConnectionDB, CorpIDConnectionStatus } from './types';

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });

let pool: Pool | null = null;

interface DatabaseSecret {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

async function getDatabaseCredentials(): Promise<DatabaseSecret> {
  const secretArn = process.env.DATABASE_SECRET_ARN;
  if (!secretArn) {
    throw new Error('DATABASE_SECRET_ARN environment variable not set');
  }

  const command = new GetSecretValueCommand({
    SecretId: secretArn,
  });

  const response = await secretsClient.send(command);
  
  if (!response.SecretString) {
    throw new Error('Database secret not found');
  }

  return JSON.parse(response.SecretString);
}

async function getPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const credentials = await getDatabaseCredentials();
  const endpoint = process.env.DATABASE_ENDPOINT || '';
  const [host, portStr] = endpoint.split(':');
  const port = parseInt(portStr || '5432', 10);
  const database = process.env.DATABASE_NAME || 'quickcorpid';

  pool = new Pool({
    host,
    port,
    database,
    user: credentials.username,
    password: credentials.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return pool;
}

/**
 * Create a new CorpID connection
 */
export async function createCorpIDConnection(
  orgId: string,
  corpId: string,
  status: CorpIDConnectionStatus,
  accessTokenEncrypted?: string,
  refreshTokenEncrypted?: string,
  tokenExpiresAt?: Date
): Promise<CorpIDConnectionDB> {
  const client = await getPool();
  const result = await client.query<CorpIDConnectionDB>(
    `INSERT INTO corpid_connections 
     (org_id, corp_id, status, access_token_encrypted, refresh_token_encrypted, token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [orgId, corpId, status, accessTokenEncrypted, refreshTokenEncrypted, tokenExpiresAt]
  );
  return result.rows[0];
}

/**
 * Get CorpID connection by org ID
 */
export async function getCorpIDConnectionByOrgId(orgId: string): Promise<CorpIDConnectionDB | null> {
  const client = await getPool();
  const result = await client.query<CorpIDConnectionDB>(
    'SELECT * FROM corpid_connections WHERE org_id = $1',
    [orgId]
  );
  return result.rows[0] || null;
}

/**
 * Get CorpID connection by CorpID
 */
export async function getCorpIDConnectionByCorpId(corpId: string): Promise<CorpIDConnectionDB | null> {
  const client = await getPool();
  const result = await client.query<CorpIDConnectionDB>(
    'SELECT * FROM corpid_connections WHERE corp_id = $1',
    [corpId]
  );
  return result.rows[0] || null;
}

/**
 * Update CorpID connection tokens
 */
export async function updateCorpIDConnectionTokens(
  connectionId: string,
  accessTokenEncrypted: string,
  refreshTokenEncrypted?: string,
  tokenExpiresAt?: Date
): Promise<CorpIDConnectionDB> {
  const client = await getPool();
  const result = await client.query<CorpIDConnectionDB>(
    `UPDATE corpid_connections 
     SET access_token_encrypted = $2, 
         refresh_token_encrypted = COALESCE($3, refresh_token_encrypted),
         token_expires_at = COALESCE($4, token_expires_at),
         status = 'active',
         last_synced_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [connectionId, accessTokenEncrypted, refreshTokenEncrypted, tokenExpiresAt]
  );
  return result.rows[0];
}

/**
 * Update CorpID connection status
 */
export async function updateCorpIDConnectionStatus(
  connectionId: string,
  status: CorpIDConnectionStatus
): Promise<CorpIDConnectionDB> {
  const client = await getPool();
  const result = await client.query<CorpIDConnectionDB>(
    `UPDATE corpid_connections 
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [connectionId, status]
  );
  return result.rows[0];
}

/**
 * Delete CorpID connection
 */
export async function deleteCorpIDConnection(connectionId: string): Promise<void> {
  const client = await getPool();
  await client.query(
    'DELETE FROM corpid_connections WHERE id = $1',
    [connectionId]
  );
}

/**
 * List all CorpID connections for an org
 */
export async function listCorpIDConnections(
  orgId: string,
  status?: CorpIDConnectionStatus
): Promise<CorpIDConnectionDB[]> {
  const client = await getPool();
  let query = 'SELECT * FROM corpid_connections WHERE org_id = $1';
  const params: any[] = [orgId];

  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const result = await client.query<CorpIDConnectionDB>(query, params);
  return result.rows;
}

/**
 * Create signing request
 */
export async function createSigningRequest(
  orgId: string,
  documentId: string,
  signers: Array<{ email: string; name: string; role?: string }>,
  expiresAt: Date
): Promise<string> {
  const client = await getPool();
  const result = await client.query<{ id: string }>(
    `INSERT INTO signing_requests 
     (org_id, document_id, status, signers, expires_at)
     VALUES ($1, $2, 'pending', $3, $4)
     RETURNING id`,
    [orgId, documentId, JSON.stringify(signers), expiresAt]
  );
  return result.rows[0].id;
}

/**
 * Get signing request
 */
export async function getSigningRequest(signingRequestId: string): Promise<any | null> {
  const client = await getPool();
  const result = await client.query(
    'SELECT * FROM signing_requests WHERE id = $1',
    [signingRequestId]
  );
  return result.rows[0] || null;
}

/**
 * Update signing request status
 */
export async function updateSigningRequestStatus(
  signingRequestId: string,
  status: string,
  completedAt?: Date
): Promise<void> {
  const client = await getPool();
  await client.query(
    `UPDATE signing_requests 
     SET status = $2, completed_at = COALESCE($3, completed_at)
     WHERE id = $1`,
    [signingRequestId, status, completedAt]
  );
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
