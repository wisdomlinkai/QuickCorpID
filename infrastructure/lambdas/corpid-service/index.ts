import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  ConnectCorpIDRequestSchema,
  GenerateQRCodeRequestSchema,
  SyncDocumentWalletRequestSchema,
  GetSigningStatusRequestSchema,
  InitiateSigningRequestSchema,
  RefreshTokenRequestSchema,
} from './types';
import { 
  createCorpIDConnection,
  getCorpIDConnectionByOrgId,
  updateCorpIDConnectionTokens,
  updateCorpIDConnectionStatus,
  deleteCorpIDConnection,
  createSigningRequest,
  getSigningRequest,
  updateSigningRequestStatus,
  closePool,
} from './database';
import { encryptCorpIDToken, decryptCorpIDToken } from './encryption';
import { CorpIDClient } from './corpid-client';

/**
 * Main Lambda handler for CorpID Integration Service
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  
  try {
    // Extract user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const method = event.httpMethod;
    const path = event.resource;
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};

    // Route to appropriate handler
    let result: any;

    switch (true) {
      // Connect CorpID (OAuth callback)
      case method === 'POST' && path === '/corpid/connect':
        result = await handleConnectCorpID(body, userId);
        break;

      // Generate QR code
      case method === 'POST' && path === '/corpid/qrcode':
        result = await handleGenerateQRCode(body, userId);
        break;

      // Check QR code status
      case method === 'GET' && path === '/corpid/qrcode/{qrCodeId}':
        result = await handleCheckQRCodeStatus(queryParams.qrCodeId as string, userId);
        break;

      // Sync Document Wallet
      case method === 'POST' && path === '/corpid/documents/sync':
        result = await handleSyncDocumentWallet(body, userId);
        break;

      // Get CorpID connection status
      case method === 'GET' && path === '/corpid/connection':
        result = await handleGetConnection(queryParams.org_id as string, userId);
        break;

      // Refresh token
      case method === 'POST' && path === '/corpid/token/refresh':
        result = await handleRefreshToken(body, userId);
        break;

      // Disconnect CorpID
      case method === 'DELETE' && path === '/corpid/connection':
        result = await handleDisconnectCorpID(queryParams.org_id as string, userId);
        break;

      // Initiate signing
      case method === 'POST' && path === '/corpid/signing/initiate':
        result = await handleInitiateSigning(body, userId);
        break;

      // Get signing status
      case method === 'GET' && path === '/corpid/signing/{signingRequestId}':
        result = await handleGetSigningStatus(queryParams, userId);
        break;

      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Not found' }),
        };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };

  } catch (error: any) {
    console.error('Handler error:', error);
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        requestId: event.requestContext.requestId,
      }),
    };
  } finally {
    // Close database connection pool
    await closePool();
    
    // Log execution time
    const executionTime = Date.now() - startTime;
    console.log(`Execution time: ${executionTime}ms`);
  }
}

/**
 * Handle CorpID connection (OAuth flow)
 */
async function handleConnectCorpID(body: any, userId: string): Promise<any> {
  const request = ConnectCorpIDRequestSchema.parse(body);
  
  const client = new CorpIDClient(request.environment);
  
  // Exchange auth code for token
  const tokenResponse = await client.exchangeAuthCode(
    request.auth_code!,
    process.env.CORPID_REDIRECT_URI || 'https://app.quickcorpid.com/callback/corpid'
  );

  // Get user info
  const userInfo = await client.getUserInfo(tokenResponse.access_token);

  // Encrypt tokens
  const encryptedAccessToken = await encryptCorpIDToken(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token 
    ? await encryptCorpIDToken(tokenResponse.refresh_token)
    : null;

  // Calculate token expiry
  const tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  // Create or update connection in database
  const existingConnection = await getCorpIDConnectionByOrgId(request.org_id);
  
  let connection;
  if (existingConnection) {
    connection = await updateCorpIDConnectionTokens(
      existingConnection.id,
      encryptedAccessToken!.encryptedToken,
      encryptedRefreshToken?.encryptedToken,
      tokenExpiresAt
    );
  } else {
    connection = await createCorpIDConnection(
      request.org_id,
      userInfo.corp_id,
      'active',
      encryptedAccessToken!.encryptedToken,
      encryptedRefreshToken?.encryptedToken,
      tokenExpiresAt
    );
  }

  return {
    connection_id: connection.id,
    corp_id: userInfo.corp_id,
    company_name: userInfo.company_name,
    br_number: userInfo.br_number,
    cr_number: userInfo.cr_number,
    status: connection.status,
    connected_at: connection.created_at.toISOString(),
  };
}

/**
 * Handle QR code generation
 */
async function handleGenerateQRCode(body: any, userId: string): Promise<any> {
  const request = GenerateQRCodeRequestSchema.parse(body);
  
  // Get CorpID connection
  const connection = await getCorpIDConnectionByOrgId(request.org_id);
  if (!connection || connection.status !== 'active') {
    throw new Error('CorpID not connected for this organisation');
  }

  // Decrypt access token
  const accessToken = await decryptCorpIDToken(connection.access_token_encrypted!);
  if (!accessToken) {
    throw new Error('Failed to decrypt access token');
  }

  // Generate QR code
  const client = new CorpIDClient('sandbox'); // TODO: Use connection environment
  const qrCode = await client.generateQRCode(accessToken, request.purpose, {
    documentId: request.document_id,
    callbackUrl: request.callback_url,
    expiresInSeconds: request.expires_in_seconds,
  });

  return {
    qr_code_id: qrCode.qrCodeId,
    qr_code_url: qrCode.qrCodeUrl,
    deep_link: qrCode.deepLink,
    expires_at: qrCode.expiresAt,
    status: 'pending',
  };
}

/**
 * Handle QR code status check
 */
async function handleCheckQRCodeStatus(qrCodeId: string, userId: string): Promise<any> {
  // In production, we would store QR code metadata and look it up
  // For now, return a placeholder
  return {
    qr_code_id: qrCodeId,
    status: 'pending',
  };
}

/**
 * Handle Document Wallet sync
 */
async function handleSyncDocumentWallet(body: any, userId: string): Promise<any> {
  const request = SyncDocumentWalletRequestSchema.parse(body);
  
  // Get CorpID connection
  const connection = await getCorpIDConnectionByOrgId(request.org_id);
  if (!connection || connection.status !== 'active') {
    throw new Error('CorpID not connected for this organisation');
  }

  // Decrypt access token
  const accessToken = await decryptCorpIDToken(connection.access_token_encrypted!);
  if (!accessToken) {
    throw new Error('Failed to decrypt access token');
  }

  // Sync document wallet
  const client = new CorpIDClient('sandbox');
  const documents = await client.syncDocumentWallet(accessToken, request.document_types);

  // Update last synced timestamp
  await updateCorpIDConnectionTokens(connection.id, connection.access_token_encrypted!);

  return {
    synced_at: new Date().toISOString(),
    documents: documents.map(doc => ({
      document_id: doc.document_id,
      document_type: doc.document_type,
      document_name: doc.document_name,
      created_at: doc.created_at,
      hash: doc.hash,
      signed: doc.signed,
    })),
  };
}

/**
 * Handle get connection status
 */
async function handleGetConnection(orgId: string, userId: string): Promise<any> {
  const connection = await getCorpIDConnectionByOrgId(orgId);
  
  if (!connection) {
    return {
      connected: false,
      status: 'not_connected',
    };
  }

  return {
    connected: connection.status === 'active',
    connection_id: connection.id,
    corp_id: connection.corp_id,
    status: connection.status,
    last_synced_at: connection.last_synced_at?.toISOString(),
    connected_at: connection.created_at.toISOString(),
  };
}

/**
 * Handle token refresh
 */
async function handleRefreshToken(body: any, userId: string): Promise<any> {
  const request = RefreshTokenRequestSchema.parse(body);
  
  const connection = await getCorpIDConnectionByOrgId(request.org_id);
  if (!connection || !connection.refresh_token_encrypted) {
    throw new Error('No refresh token available');
  }

  // Decrypt refresh token
  const refreshToken = await decryptCorpIDToken(connection.refresh_token_encrypted);
  if (!refreshToken) {
    throw new Error('Failed to decrypt refresh token');
  }

  // Refresh token
  const client = new CorpIDClient('sandbox');
  const tokenResponse = await client.refreshAccessToken(refreshToken);

  // Encrypt new tokens
  const encryptedAccessToken = await encryptCorpIDToken(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token 
    ? await encryptCorpIDToken(tokenResponse.refresh_token)
    : null;

  // Update tokens
  const tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
  await updateCorpIDConnectionTokens(
    connection.id,
    encryptedAccessToken!.encryptedToken,
    encryptedRefreshToken?.encryptedToken,
    tokenExpiresAt
  );

  return {
    success: true,
    expires_at: tokenExpiresAt.toISOString(),
  };
}

/**
 * Handle disconnect CorpID
 */
async function handleDisconnectCorpID(orgId: string, userId: string): Promise<any> {
  const connection = await getCorpIDConnectionByOrgId(orgId);
  
  if (!connection) {
    return { success: true };
  }

  // Revoke connection with CorpID
  if (connection.access_token_encrypted) {
    const accessToken = await decryptCorpIDToken(connection.access_token_encrypted);
    if (accessToken) {
      const client = new CorpIDClient('sandbox');
      await client.revokeConnection(accessToken);
    }
  }

  // Delete connection from database
  await deleteCorpIDConnection(connection.id);

  return { success: true };
}

/**
 * Handle initiate signing
 */
async function handleInitiateSigning(body: any, userId: string): Promise<any> {
  const request = InitiateSigningRequestSchema.parse(body);
  
  // Get CorpID connection
  const connection = await getCorpIDConnectionByOrgId(request.org_id);
  if (!connection || connection.status !== 'active') {
    throw new Error('CorpID not connected for this organisation');
  }

  // Decrypt access token
  const accessToken = await decryptCorpIDToken(connection.access_token_encrypted!);
  if (!accessToken) {
    throw new Error('Failed to decrypt access token');
  }

  // Initiate signing with CorpID
  const client = new CorpIDClient('sandbox');
  const signingResult = await client.initiateSigning(
    accessToken,
    request.document_id,
    request.signers,
    {
      callbackUrl: request.callback_url,
      expiresInHours: request.expires_in_hours,
    }
  );

  // Create signing request in database
  const expiresAt = new Date(Date.now() + request.expires_in_hours * 60 * 60 * 1000);
  const signingRequestId = await createSigningRequest(
    request.org_id,
    request.document_id,
    request.signers,
    expiresAt
  );

  return {
    signing_request_id: signingRequestId,
    qr_code_url: signingResult.qrCodeUrl,
    deep_link: signingResult.deepLink,
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Handle get signing status
 */
async function handleGetSigningStatus(queryParams: any, userId: string): Promise<any> {
  const request = GetSigningStatusRequestSchema.parse({
    org_id: queryParams.org_id,
    signing_request_id: queryParams.signingRequestId,
  });

  // Get signing request from database
  const signingRequest = await getSigningRequest(request.signing_request_id);
  if (!signingRequest) {
    throw new Error('Signing request not found');
  }

  return {
    signing_request_id: signingRequest.id,
    status: signingRequest.status,
    signers: signingRequest.signers,
    completed_at: signingRequest.completed_at?.toISOString(),
    document_url: signingRequest.document_url,
  };
}
