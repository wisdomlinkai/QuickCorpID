/**
 * CorpID Sandbox API Integration Service
 * 
 * This module provides integration with the Hong Kong CorpID Platform.
 * CorpID enables companies to authenticate their identity digitally, 
 * authorise representatives, and access services through a unified interface.
 * 
 * Sandbox URL: https://sb.corpid.gov.hk/
 * Production URL: https://corpid.gov.hk/ (launching end of 2026)
 * 
 * Key Features:
 * - Digital corporate identity authentication
 * - Digital signing (legally recognized)
 * - Form pre-filling
 * - Storage of digital licences and permits
 * 
 * Integration Points:
 * - Business Registration Verification (with IRD)
 * - Company Registry Integration
 * - iAM Smart identity verification
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Business types recognized by CorpID
 */
export type BusinessType = 
  | 'limited_company'      // Limited Company (私人有限公司)
  | 'sole_proprietorship'  // Sole Proprietorship (獨資)
  | 'partnership'          // Partnership (合夥)
  | 'branch_company'       // Branch of Foreign Company (海外公司分公司)
  | 'other';

/**
 * Identity document types
 */
export type IdentityType = 
  | 'hkid'      // Hong Kong ID Card
  | 'passport'; // Foreign Passport

/**
 * Applicant role in the company
 */
export type ApplicantRole = 
  | 'director'   // Company Director
  | 'owner'      // Business Owner (for sole proprietorship)
  | 'partner'    // Partner (for partnership)
  | 'authorized_representative'; // Authorized Representative

/**
 * Application status in CorpID system
 */
export type CorpIDApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'verifying'
  | 'pending_documents'
  | 'pending_verification'
  | 'approved'
  | 'rejected';

/**
 * CorpID Application data structure
 * Maps to what CorpID requires for corporate identity registration
 */
export interface CorpIDApplication {
  // Business Information (from Business Registration Certificate)
  business: {
    brNumber: string;           // 8-digit Business Registration Number
    companyNameEn?: string;     // Company name in English
    companyNameZh?: string;     // Company name in Chinese
    businessType: BusinessType;
    incorporationDate?: string; // Date of incorporation/registration
    registeredAddress?: string; // Registered office address
  };
  
  // Identity Verification (for the applicant)
  identity: {
    idType: IdentityType;
    idNumber: string;           // HKID: A123456(7) format, or passport number
    idDocumentUrl?: string;     // Uploaded document URL
    iAMSmartVerified?: boolean; // Whether verified via iAM Smart
  };
  
  // Applicant Information
  applicant: {
    role: ApplicantRole;
    fullName?: string;
    email: string;
    phone?: string;
    authorizationDocument?: string; // For authorized representatives
  };
  
  // Terms & Declarations
  declarations: {
    agreeTerms: boolean;
    authDeclaration: boolean;   // Authorized to act on behalf of company
    dataConsent: boolean;       // Consent for data processing
  };
}

/**
 * CorpID verification result
 */
export interface CorpIDVerificationResult {
  valid: boolean;
  companyName?: string;
  companyType?: BusinessType;
  incorporationDate?: string;
  status?: 'active' | 'deregistered' | 'inactive';
  error?: string;
}

/**
 * CorpID application submission result
 */
export interface CorpIDSubmissionResult {
  success: boolean;
  refNumber?: string;
  status?: CorpIDApplicationStatus;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * CorpID status check result
 */
export interface CorpIDStatusResult {
  refNumber: string;
  status: CorpIDApplicationStatus;
  statusMessage: string;
  lastUpdated: string;
  estimatedCompletion?: string;
  nextSteps?: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const CORPID_CONFIG = {
  // Sandbox environment (use for development)
  sandbox: {
    baseUrl: 'https://sb.corpid.gov.hk/api/v1',
    oauthUrl: 'https://sb.corpid.gov.hk/oauth',
    timeout: 30000,
  },
  // Production environment (launching end of 2026)
  production: {
    baseUrl: 'https://corpid.gov.hk/api/v1',
    oauthUrl: 'https://corpid.gov.hk/oauth',
    timeout: 30000,
  },
};

// Determine which environment to use
const isProduction = typeof import.meta !== 'undefined' ? import.meta.env.PROD : false;
const config = isProduction ? CORPID_CONFIG.production : CORPID_CONFIG.sandbox;

// ============================================================================
// API Client (Placeholder Implementation)
// ============================================================================

/**
 * CorpID API Client
 * 
 * Note: The actual CorpID Sandbox API endpoints will be available
 * when you register at https://sb.corpid.gov.hk/
 * 
 * This implementation provides mock responses for development.
 * Replace mock implementations with real API calls when credentials are available.
 */
class CorpIDAPIClient {
  private baseUrl: string;
  private timeout: number;
  private apiKey: string | null = null;

  constructor() {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
  }

  /**
   * Set API key for authenticated requests
   */
  setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * Make an API request (placeholder for future implementation)
   */
  private async request<T>(
    endpoint: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: RequestInit = {}
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      // For now, return mock responses
      // In production, this would make actual HTTP requests to endpoint
      console.log(`API call to: ${endpoint}`);
      throw new Error('API not configured - using mock mode');
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}

// ============================================================================
// Mock Implementations (for development)
// ============================================================================

/**
 * Simulate network delay
 */
const simulateDelay = (ms: number = 1000) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sample verified BR numbers for testing
 */
const SAMPLE_BR_DATA: Record<string, CorpIDVerificationResult> = {
  '12345678': {
    valid: true,
    companyName: 'Sample Trading Limited',
    companyType: 'limited_company',
    incorporationDate: '2020-01-15',
    status: 'active',
  },
  '87654321': {
    valid: true,
    companyName: '測試貿易有限公司',
    companyType: 'limited_company',
    incorporationDate: '2019-06-20',
    status: 'active',
  },
  '11111111': {
    valid: false,
    error: 'Business Registration Number not found',
  },
};

/**
 * Verify a Business Registration Number
 * 
 * In production, this calls the CorpID API which integrates with
 * the Inland Revenue Department (IRD) to verify BR numbers.
 * 
 * @param brNumber - 8-digit Business Registration Number
 * @returns Verification result with company details if valid
 */
export async function verifyBRNumber(
  brNumber: string
): Promise<CorpIDVerificationResult> {
  await simulateDelay(800);

  // Validate format
  if (!/^\d{8}$/.test(brNumber)) {
    return {
      valid: false,
      error: 'Invalid BR number format. Must be 8 digits.',
    };
  }

  // Check sample data
  if (SAMPLE_BR_DATA[brNumber]) {
    return SAMPLE_BR_DATA[brNumber];
  }

  // For any other valid-format BR number, simulate a response
  // In production, this would call the actual API
  const isValid = parseInt(brNumber) % 3 !== 0; // Simulate some failures
  
  if (isValid) {
    return {
      valid: true,
      companyName: `Company ${brNumber.slice(0, 4)}`,
      companyType: 'limited_company',
      status: 'active',
    };
  }

  return {
    valid: false,
    error: 'Business Registration Number not found in registry',
  };
}

/**
 * Validate Hong Kong ID Card format and checksum
 * 
 * HKID format: A123456(7) - one or two letters, 6 digits, check digit in parentheses
 * 
 * @param hkid - HKID string
 * @returns Whether the HKID is valid
 */
export function validateHKIDFormat(hkid: string): boolean {
  // Clean and normalize
  const cleaned = hkid.toUpperCase().replace(/\s/g, '');
  
  // Match format: 1-2 letters, 6 digits, 1 check digit in parentheses
  const match = cleaned.match(/^([A-Z]{1,2})(\d{6})\((\d)\)$/);
  
  if (!match) return false;
  
  const [, letters, digits, checkDigit] = match;
  
  // Calculate checksum
  // Reference: Hong Kong ID Card check digit algorithm
  let sum = 0;
  
  // Weight for each position (from right to left, excluding check digit)
  // For 2-letter HKID: weights are 9, 8 for letters, then 7,6,5,4,3,2 for digits
  // For 1-letter HKID: treat first position as space (value 36), weight 9
  
  const chars = (letters.length === 1 ? ' ' + letters : letters) + digits;
  
  for (let i = 0; i < 8; i++) {
    let value: number;
    if (chars[i] === ' ') {
      value = 36; // Space character value
    } else if (chars[i] >= 'A' && chars[i] <= 'Z') {
      value = chars[i].charCodeAt(0) - 55; // A=10, B=11, etc.
    } else {
      value = parseInt(chars[i]);
    }
    sum += value * (9 - i);
  }
  
  // Calculate expected check digit
  const remainder = sum % 11;
  const expectedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
  
  return expectedCheckDigit === parseInt(checkDigit);
}

/**
 * Submit a CorpID application
 * 
 * @param application - Complete application data
 * @returns Submission result with reference number
 */
export async function submitApplication(
  application: CorpIDApplication
): Promise<CorpIDSubmissionResult> {
  await simulateDelay(1500);

  // Validate required fields
  const errors: Array<{ field: string; message: string }> = [];

  if (!application.business.brNumber) {
    errors.push({ field: 'brNumber', message: 'Business Registration Number is required' });
  }

  if (!application.identity.idNumber) {
    errors.push({ field: 'idNumber', message: 'Identity document number is required' });
  }

  if (!application.applicant.email) {
    errors.push({ field: 'email', message: 'Email address is required' });
  }

  if (!application.declarations.agreeTerms) {
    errors.push({ field: 'agreeTerms', message: 'You must agree to the terms and conditions' });
  }

  if (!application.declarations.authDeclaration) {
    errors.push({ field: 'authDeclaration', message: 'Authorization declaration is required' });
  }

  if (errors.length > 0) {
    return {
      success: false,
      message: 'Validation failed',
      errors,
    };
  }

  // Generate reference number
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const refNumber = `CORP-${year}-${random}`;

  // Simulate success
  return {
    success: true,
    refNumber,
    status: 'submitted',
    message: 'Application submitted successfully. You will receive a confirmation email shortly.',
  };
}

/**
 * Check the status of a CorpID application
 * 
 * @param refNumber - Application reference number
 * @returns Current status and details
 */
export async function checkApplicationStatus(
  refNumber: string
): Promise<CorpIDStatusResult> {
  await simulateDelay(500);

  // Validate reference number format
  if (!refNumber.match(/^CORP-\d{4}-[A-Z0-9]{6}$/)) {
    throw new Error('Invalid reference number format');
  }

  // Simulate status progression
  // In production, this would fetch actual status from CorpID
  const hour = new Date().getHours();
  let status: CorpIDApplicationStatus;
  let statusMessage: string;
  let nextSteps: string[];

  if (hour < 10) {
    status = 'submitted';
    statusMessage = 'Your application has been submitted and is being processed.';
    nextSteps = [
      'Wait for initial review (usually within 1-2 business days)',
      'Check your email for any additional document requests',
    ];
  } else if (hour < 14) {
    status = 'verifying';
    statusMessage = 'Your application is being verified with the relevant authorities.';
    nextSteps = [
      'Verification in progress',
      'You may be contacted for additional information',
    ];
  } else {
    status = 'approved';
    statusMessage = 'Congratulations! Your CorpID has been approved.';
    nextSteps = [
      'Your CorpID certificate is ready for download',
      'You can now use CorpID for digital transactions',
    ];
  }

  return {
    refNumber,
    status,
    statusMessage,
    lastUpdated: new Date().toISOString(),
    estimatedCompletion: status === 'approved' 
      ? undefined 
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    nextSteps,
  };
}

/**
 * Initiate iAM Smart authentication
 * 
 * iAM Smart is Hong Kong's digital identity platform for individuals.
 * CorpID uses iAM Smart for identity verification of company representatives.
 * 
 * @param redirectUri - Where to redirect after authentication
 * @returns OAuth authorization URL
 */
export function getIAMSmartAuthUrl(redirectUri: string): string {
  const clientId = typeof import.meta !== 'undefined' 
    ? (import.meta.env.VITE_IAMSMART_CLIENT_ID || 'mock_client_id')
    : 'mock_client_id';
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state: Math.random().toString(36).substring(7),
  });

  return `${config.oauthUrl}/authorize?${params.toString()}`;
}

/**
 * Handle iAM Smart OAuth callback
 * 
 * @param code - Authorization code from iAM Smart
 * @returns User information from iAM Smart
 */
export async function handleIAMSmartCallback(code: string): Promise<{
  success: boolean;
  user?: {
    hkid?: string;
    name?: string;
    email?: string;
  };
  error?: string;
}> {
  await simulateDelay(1000);

  // Mock implementation
  // In production, exchange code for token and fetch user info
  if (code) {
    return {
      success: true,
      user: {
        name: 'Verified User',
        email: 'verified@example.com',
      },
    };
  }

  return {
    success: false,
    error: 'Invalid authorization code',
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format HKID for display (add spaces for readability)
 */
export function formatHKID(hkid: string): string {
  const cleaned = hkid.toUpperCase().replace(/\s/g, '');
  const match = cleaned.match(/^([A-Z]{1,2})(\d{6})\((\d)\)$/);
  
  if (!match) return hkid;
  
  const [, letters, digits, checkDigit] = match;
  
  if (letters.length === 1) {
    return `${letters} ${digits.slice(0, 3)} ${digits.slice(3)} (${checkDigit})`;
  }
  
  return `${letters} ${digits.slice(0, 3)} ${digits.slice(3)} (${checkDigit})`;
}

/**
 * Format BR number for display
 */
export function formatBRNumber(br: string): string {
  const cleaned = br.replace(/\D/g, '');
  if (cleaned.length !== 8) return br;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
}

/**
 * Get business type label in current language
 */
export function getBusinessTypeLabel(type: BusinessType, lang: 'en' | 'zh'): string {
  const labels: Record<BusinessType, { en: string; zh: string }> = {
    limited_company: { en: 'Limited Company', zh: '有限公司' },
    sole_proprietorship: { en: 'Sole Proprietorship', zh: '獨資經營' },
    partnership: { en: 'Partnership', zh: '合夥經營' },
    branch_company: { en: 'Branch of Foreign Company', zh: '海外公司分公司' },
    other: { en: 'Other', zh: '其他' },
  };
  
  return labels[type]?.[lang] || type;
}

/**
 * Get applicant role label in current language
 */
export function getApplicantRoleLabel(role: ApplicantRole, lang: 'en' | 'zh'): string {
  const labels: Record<ApplicantRole, { en: string; zh: string }> = {
    director: { en: 'Company Director', zh: '公司董事' },
    owner: { en: 'Business Owner', zh: '業務擁有人' },
    partner: { en: 'Partner', zh: '合夥人' },
    authorized_representative: { en: 'Authorized Representative', zh: '獲授權代表' },
  };
  
  return labels[role]?.[lang] || role;
}

/**
 * Get status label in current language
 */
export function getStatusLabel(status: CorpIDApplicationStatus, lang: 'en' | 'zh'): string {
  const labels: Record<CorpIDApplicationStatus, { en: string; zh: string }> = {
    draft: { en: 'Draft', zh: '草稿' },
    submitted: { en: 'Submitted', zh: '已提交' },
    verifying: { en: 'Verifying', zh: '驗證中' },
    pending_documents: { en: 'Pending Documents', zh: '待補文件' },
    pending_verification: { en: 'Pending Verification', zh: '待驗證' },
    approved: { en: 'Approved', zh: '已批准' },
    rejected: { en: 'Rejected', zh: '已拒絕' },
  };
  
  return labels[status]?.[lang] || status;
}

// Export the API client instance
export const corpidClient = new CorpIDAPIClient();
