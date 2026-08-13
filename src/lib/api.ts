/**
 * API Client for QuickCorpID Backend Services
 * 
 * Connects to deployed AWS Lambda services via API Gateway
 * - Auth Service: User authentication
 * - Organisation Service: Organisation management
 * - CorpID Service: CorpID integration
 * - Document Service: Document management
 */

import { fetchAuthSession } from 'aws-amplify/auth';

// API endpoints from environment
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || '';
const ORG_API_URL = import.meta.env.VITE_ORG_API_URL || '';
const CORPID_API_URL = import.meta.env.VITE_CORPID_API_URL || '';
const DOCUMENT_API_URL = import.meta.env.VITE_DOCUMENT_API_URL || '';

/**
 * Get JWT token from Cognito session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<{ data: any; error: Error | null }> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || 'API request failed');
    }

    return { data: result.data || result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============ Organisation Service API ============

export interface Organisation {
  id: string;
  name: string;
  br_number: string;
  cr_number?: string;
  corp_id_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganisationMember {
  id: string;
  user_id: string;
  organisation_id: string;
  role: 'owner' | 'admin' | 'authorised_rep' | 'viewer';
  email: string;
  full_name?: string;
  status: 'active' | 'pending' | 'suspended';
  joined_at: string;
}

export const organisationApi = {
  /**
   * Create a new organisation
   */
  async create(data: { name: string; br_number: string; cr_number?: string }): Promise<{ data: Organisation | null; error: Error | null }> {
    return apiRequest(`${ORG_API_URL}/organisations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all organisations for current user
   */
  async list(): Promise<{ data: Organisation[] | null; error: Error | null }> {
    return apiRequest(`${ORG_API_URL}/organisations`);
  },

  /**
   * Get organisation by ID
   */
  async get(orgId: string): Promise<{ data: Organisation | null; error: Error | null }> {
    return apiRequest(`${ORG_API_URL}/organisations/${orgId}`);
  },

  /**
   * Update organisation
   */
  async update(orgId: string, data: Partial<Organisation>): Promise<{ data: Organisation | null; error: Error | null }> {
    return apiRequest(`${ORG_API_URL}/organisations/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Invite member to organisation
   */
  async inviteMember(orgId: string, data: { email: string; role: string }): Promise<{ data: OrganisationMember | null; error: Error | null }> {
    return apiRequest(`${ORG_API_URL}/organisations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List organisation members
   */
  async listMembers(orgId: string): Promise<{ data: OrganisationMember[] | null; error: Error | null }> {
    return apiRequest(`${ORG_API_URL}/organisations/${orgId}/members`);
  },

  /**
   * Update member role
   */
  async updateMember(orgId: string, memberId: string, role: string): Promise<{ data: OrganisationMember | null; error: Error | null }> {
    return apiRequest(`${ORG_API_URL}/organisations/${orgId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  /**
   * Remove member from organisation
   */
  async removeMember(orgId: string, memberId: string): Promise<{ error: Error | null }> {
    const result = await apiRequest(`${ORG_API_URL}/organisations/${orgId}/members/${memberId}`, {
      method: 'DELETE',
    });
    return { error: result.error };
  },
};

// ============ CorpID Service API ============

export interface CorpIDConnection {
  org_id: string;
  corp_id_token: string;
  status: 'connected' | 'disconnected' | 'error';
  connected_at: string;
  last_synced_at?: string;
}

export interface CorpIDQRCode {
  qr_code_url: string;
  session_id: string;
  expires_at: string;
}

export const corpidApi = {
  /**
   * Initiate CorpID connection (get QR code)
   */
  async initiateConnection(orgId: string): Promise<{ data: CorpIDQRCode | null; error: Error | null }> {
    return apiRequest(`${CORPID_API_URL}/organisations/${orgId}/corpid/connect`, {
      method: 'POST',
    });
  },

  /**
   * Check CorpID connection status
   */
  async checkConnection(orgId: string): Promise<{ data: CorpIDConnection | null; error: Error | null }> {
    return apiRequest(`${CORPID_API_URL}/organisations/${orgId}/corpid/status`);
  },

  /**
   * Disconnect CorpID
   */
  async disconnect(orgId: string): Promise<{ error: Error | null }> {
    const result = await apiRequest(`${CORPID_API_URL}/organisations/${orgId}/corpid/disconnect`, {
      method: 'POST',
    });
    return { error: result.error };
  },

  /**
   * Get CorpID profile data
   */
  async getProfile(orgId: string): Promise<{ data: any | null; error: Error | null }> {
    return apiRequest(`${CORPID_API_URL}/organisations/${orgId}/corpid/profile`);
  },
};

// ============ Document Service API ============

export interface Document {
  id: string;
  organisation_id: string;
  title: string;
  type: 'contract' | 'resolution' | 'tsw_form' | 'tax_document' | 'annual_return' | 'br_certificate' | 'incorporation_doc' | 'other';
  status: 'pending' | 'uploaded' | 'verified' | 'archived' | 'deleted';
  s3_key: string;
  s3_version: string;
  version: number;
  hash?: string;
  size_bytes?: number;
  mime_type?: string;
  description?: string;
  metadata?: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  download_url?: string;
}

export interface UploadUrlResponse {
  document_id: string;
  upload_url: string;
  expires_at: string;
}

export const documentApi = {
  /**
   * Create document metadata
   */
  async create(orgId: string, data: { title: string; type: Document['type']; description?: string }): Promise<{ data: Document | null; error: Error | null }> {
    return apiRequest(`${DOCUMENT_API_URL}/organisations/${orgId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List documents
   */
  async list(orgId: string, page: number = 1, pageSize: number = 20): Promise<{ data: { documents: Document[]; total: number } | null; error: Error | null }> {
    return apiRequest(`${DOCUMENT_API_URL}/organisations/${orgId}/documents?page=${page}&page_size=${pageSize}`);
  },

  /**
   * Get document by ID
   */
  async get(orgId: string, docId: string): Promise<{ data: Document | null; error: Error | null }> {
    return apiRequest(`${DOCUMENT_API_URL}/organisations/${orgId}/documents/${docId}`);
  },

  /**
   * Get upload URL
   */
  async getUploadUrl(orgId: string, docId: string): Promise<{ data: UploadUrlResponse | null; error: Error | null }> {
    return apiRequest(`${DOCUMENT_API_URL}/organisations/${orgId}/documents/${docId}/upload-url`, {
      method: 'POST',
    });
  },

  /**
   * Confirm document upload
   */
  async confirmUpload(orgId: string, docId: string, data: { hash?: string; size_bytes?: number; mime_type?: string }): Promise<{ data: Document | null; error: Error | null }> {
    return apiRequest(`${DOCUMENT_API_URL}/organisations/${orgId}/documents/${docId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update document
   */
  async update(orgId: string, docId: string, data: Partial<Document>): Promise<{ data: Document | null; error: Error | null }> {
    return apiRequest(`${DOCUMENT_API_URL}/organisations/${orgId}/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete document
   */
  async delete(orgId: string, docId: string): Promise<{ error: Error | null }> {
    const result = await apiRequest(`${DOCUMENT_API_URL}/organisations/${orgId}/documents/${docId}`, {
      method: 'DELETE',
    });
    return { error: result.error };
  },

  /**
   * Upload file to S3 using pre-signed URL
   */
  async uploadFile(uploadUrl: string, file: File): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },
};

export default {
  organisation: organisationApi,
  corpid: corpidApi,
  document: documentApi,
};
