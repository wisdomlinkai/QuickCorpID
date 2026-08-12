import type { 
  CorpIDEnvironment, 
  CorpIDTokenResponse, 
  CorpIDUserInfo,
  CorpIDDocument 
} from './types';
import { decryptCorpIDToken } from './encryption';

/**
 * CorpID API Client
 * Handles OAuth, token exchange, and Document Wallet operations
 */
export class CorpIDClient {
  private environment: CorpIDEnvironment;
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(environment: CorpIDEnvironment) {
    this.environment = environment;
    
    // CorpID API endpoints (these would be actual CorpID endpoints in production)
    if (environment === 'sandbox') {
      this.baseUrl = process.env.CORPID_SANDBOX_URL || 'https://sandbox.corpid.gov.hk/api/v1';
    } else {
      this.baseUrl = process.env.CORPID_PRODUCTION_URL || 'https://api.corpid.gov.hk/v1';
    }

    // Client credentials from environment
    if (environment === 'sandbox') {
      this.clientId = process.env.CORPID_SANDBOX_CLIENT_ID || '';
      this.clientSecret = process.env.CORPID_SANDBOX_CLIENT_SECRET || '';
    } else {
      this.clientId = process.env.CORPID_PRODUCTION_CLIENT_ID || '';
      this.clientSecret = process.env.CORPID_PRODUCTION_CLIENT_SECRET || '';
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeAuthCode(authCode: string, redirectUri: string): Promise<CorpIDTokenResponse> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange auth code: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<CorpIDTokenResponse> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user/company information from CorpID
   */
  async getUserInfo(accessToken: string): Promise<CorpIDUserInfo> {
    const response = await fetch(`${this.baseUrl}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return response.json();
  }

  /**
   * Generate QR code for login/signing
   */
  async generateQRCode(
    accessToken: string,
    purpose: 'login' | 'signing' | 'document_wallet',
    options?: {
      documentId?: string;
      callbackUrl?: string;
      expiresInSeconds?: number;
    }
  ): Promise<{
    qrCodeId: string;
    qrCodeUrl: string;
    deepLink?: string;
    expiresAt: string;
  }> {
    const response = await fetch(`${this.baseUrl}/qrcode/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        purpose,
        document_id: options?.documentId,
        callback_url: options?.callbackUrl,
        expires_in_seconds: options?.expiresInSeconds || 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate QR code: ${error}`);
    }

    const data = await response.json();
    return {
      qrCodeId: data.qr_code_id,
      qrCodeUrl: data.qr_code_url,
      deepLink: data.deep_link,
      expiresAt: data.expires_at,
    };
  }

  /**
   * Check QR code scan status
   */
  async checkQRCodeStatus(accessToken: string, qrCodeId: string): Promise<{
    status: 'pending' | 'scanned' | 'completed' | 'expired';
    result?: any;
  }> {
    const response = await fetch(`${this.baseUrl}/qrcode/${qrCodeId}/status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to check QR code status: ${error}`);
    }

    return response.json();
  }

  /**
   * Sync Document Wallet
   */
  async syncDocumentWallet(
    accessToken: string,
    documentTypes?: string[]
  ): Promise<CorpIDDocument[]> {
    const url = new URL(`${this.baseUrl}/document-wallet/sync`);
    
    if (documentTypes && documentTypes.length > 0) {
      url.searchParams.set('document_types', documentTypes.join(','));
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to sync document wallet: ${error}`);
    }

    const data = await response.json();
    return data.documents || [];
  }

  /**
   * Initiate digital signing request
   */
  async initiateSigning(
    accessToken: string,
    documentId: string,
    signers: Array<{ email: string; name: string; role?: string }>,
    options?: {
      callbackUrl?: string;
      expiresInHours?: number;
    }
  ): Promise<{
    signingRequestId: string;
    qrCodeUrl: string;
    deepLink?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/signing/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: documentId,
        signers,
        callback_url: options?.callbackUrl,
        expires_in_hours: options?.expiresInHours || 72,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to initiate signing: ${error}`);
    }

    const data = await response.json();
    return {
      signingRequestId: data.signing_request_id,
      qrCodeUrl: data.qr_code_url,
      deepLink: data.deep_link,
    };
  }

  /**
   * Check signing request status
   */
  async checkSigningStatus(accessToken: string, signingRequestId: string): Promise<{
    status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'cancelled';
    signers: Array<{
      email: string;
      name: string;
      status: 'pending' | 'signed' | 'declined';
      signedAt?: string;
    }>;
    completedAt?: string;
    documentUrl?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/signing/${signingRequestId}/status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to check signing status: ${error}`);
    }

    return response.json();
  }

  /**
   * Revoke connection
   */
  async revokeConnection(accessToken: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/connection/revoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to revoke connection:', error);
      // Don't throw - revocation should be best effort
    }
  }
}
