/**
 * CorpID Sandbox API Mock Service
 * 
 * This module provides mock implementations of CorpID Sandbox API endpoints.
 * Replace these with actual API calls when integrating with the real CorpID Sandbox.
 * 
 * @module services/corpidApi
 * 
 * @example
 * // Submit an application
 * import { submitApplication } from './services/corpidApi';
 * 
 * const result = await submitApplication({
 *   business: { brNumber: '12345678', companyNameEn: 'Acme Ltd', businessType: 'Limited Company' },
 *   identity: { idType: 'hkid', idNumber: 'A123456(7)' },
 *   applicant: { role: 'owner', email: 'user@example.com' },
 *   agreeTerms: true,
 *   authDeclaration: true
 * });
 * 
 * @see https://sb.corpid.gov.hk/ for CorpID Sandbox registration
 * 
 * API Endpoints (production):
 * - Sandbox: https://sb.corpid.gov.hk/api/
 * - Production: https://api.corpid.gov.hk/
 */

// ============ Type Definitions ============

export type ApplicationStatus = 'pending' | 'processing' | 'approved' | 'rejected';

export interface BusinessDetails {
  brNumber: string;
  companyNameEn?: string;
  companyNameZh?: string;
  businessType: string;
}

export interface IdentityDetails {
  idType: 'hkid' | 'passport';
  idNumber: string;
  documentFile?: File | null;
}

export interface ApplicantDetails {
  role: 'owner' | 'employee' | 'agent';
  email?: string;
  phone?: string;
}

export interface CorpIDApplication {
  business: BusinessDetails;
  identity: IdentityDetails;
  applicant: ApplicantDetails;
  agreeTerms: boolean;
  authDeclaration: boolean;
}

export interface SubmitResult {
  success: boolean;
  refNumber?: string;
  message: string;
  estimatedProcessingDays?: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface StatusResult {
  refNumber: string;
  status: ApplicationStatus;
  lastUpdated: string;
  statusHistory: Array<{
    status: ApplicationStatus;
    timestamp: string;
    description: string;
  }>;
  nextSteps?: string[];
  corpId?: string; // Only available when approved
}

export interface VerificationResult {
  valid: boolean;
  companyName?: string;
  companyNameZh?: string;
  businessType?: string;
  registrationDate?: string;
  expiryDate?: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============ Mock API Configuration ============

const MOCK_DELAY_MIN = 800;
const MOCK_DELAY_MAX = 2000;

// Simulate network delay
const simulateDelay = (): Promise<void> => {
  const delay = Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN) + MOCK_DELAY_MIN;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Simulate occasional network failures (5% chance)
const simulateNetworkError = (): boolean => {
  return Math.random() < 0.05;
};

// ============ Mock API Functions ============

/**
 * Submit a new CorpID application
 * 
 * @param application - The application data
 * @returns Promise resolving to submit result
 */
export async function submitApplication(
  application: CorpIDApplication
): Promise<SubmitResult> {
  await simulateDelay();

  // Simulate network error
  if (simulateNetworkError()) {
    throw {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to CorpID service. Please try again.',
    } as ApiError;
  }

  // Validate required fields
  const errors: Array<{ field: string; message: string }> = [];
  
  if (!application.business.brNumber || !/^\d{8}$/.test(application.business.brNumber)) {
    errors.push({ field: 'brNumber', message: 'Invalid Business Registration Number' });
  }
  
  if (!application.business.companyNameEn && !application.business.companyNameZh) {
    errors.push({ field: 'companyName', message: 'Company name is required' });
  }
  
  if (!application.identity.idNumber) {
    errors.push({ field: 'idNumber', message: 'ID number is required' });
  }
  
  if (!application.applicant.role) {
    errors.push({ field: 'role', message: 'Role is required' });
  }
  
  if (!application.agreeTerms) {
    errors.push({ field: 'agreeTerms', message: 'Must agree to terms' });
  }
  
  if (!application.authDeclaration) {
    errors.push({ field: 'authDeclaration', message: 'Authorization declaration required' });
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
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const refNumber = `CORP-${year}-${randomPart}`;

  return {
    success: true,
    refNumber,
    message: 'Application submitted successfully',
    estimatedProcessingDays: 3,
  };
}

/**
 * Check the status of an existing application
 * 
 * @param refNumber - The application reference number
 * @returns Promise resolving to status result
 */
export async function checkStatus(refNumber: string): Promise<StatusResult> {
  await simulateDelay();

  // Simulate network error
  if (simulateNetworkError()) {
    throw {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to CorpID service. Please try again.',
    } as ApiError;
  }

  // Validate reference number format
  if (!/^CORP-\d{4}-[A-Z0-9]{6}$/.test(refNumber)) {
    throw {
      code: 'INVALID_REF',
      message: 'Invalid reference number format',
    } as ApiError;
  }

  // Simulate different statuses based on reference number
  // In real implementation, this would fetch from the API
  const now = new Date().toISOString();
  const submittedDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
  
  // Use last character to determine status for demo purposes
  const lastChar = refNumber.slice(-1);
  let status: ApplicationStatus;
  let nextSteps: string[] | undefined;
  let corpId: string | undefined;

  if (/[0-4]/.test(lastChar)) {
    status = 'approved';
    corpId = `HK${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    nextSteps = [
      'Your CorpID is now active',
      'You can use it for government services',
      'Set up digital signing capabilities',
    ];
  } else if (/[5-7]/.test(lastChar)) {
    status = 'processing';
    nextSteps = [
      'Application is under review',
      'Expected completion in 1-2 business days',
    ];
  } else {
    status = 'pending';
    nextSteps = [
      'Waiting for initial review',
      'Check back in 24 hours',
    ];
  }

  return {
    refNumber,
    status,
    lastUpdated: now,
    statusHistory: [
      {
        status: 'pending',
        timestamp: submittedDate,
        description: 'Application submitted',
      },
      ...(status !== 'pending' ? [{
        status: 'processing' as ApplicationStatus,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Application under review',
      }] : []),
      ...(status === 'approved' ? [{
        status: 'approved' as ApplicationStatus,
        timestamp: now,
        description: 'CorpID approved and issued',
      }] : []),
    ],
    nextSteps,
    corpId,
  };
}

/**
 * Verify a Business Registration Number
 * 
 * @param brNumber - 8-digit BR number
 * @returns Promise resolving to verification result
 */
export async function verifyBRNumber(brNumber: string): Promise<VerificationResult> {
  await simulateDelay();

  // Simulate network error
  if (simulateNetworkError()) {
    throw {
      code: 'NETWORK_ERROR',
      message: 'Unable to verify BR number. Please try again.',
    } as ApiError;
  }

  // Validate format
  if (!/^\d{8}$/.test(brNumber)) {
    return {
      valid: false,
      message: 'Invalid BR number format. Must be 8 digits.',
    };
  }

  // Simulate BR verification
  // In production, this would call IRD API
  // For demo, we'll return mock data for certain patterns
  
  // Demo: numbers starting with 1-8 are valid, 9 are invalid
  if (brNumber.startsWith('9')) {
    return {
      valid: false,
      message: 'Business Registration Number not found in registry.',
    };
  }

  // Generate mock company data based on BR number
  const companyTypes = [
    'Limited Company',
    'Sole Proprietorship',
    'Partnership',
    'Branch Office',
  ];
  
  const typeIndex = parseInt(brNumber.charAt(0)) % companyTypes.length;
  
  return {
    valid: true,
    companyName: `Sample Company ${brNumber.slice(-4)} Limited`,
    companyNameZh: `示例公司 ${brNumber.slice(-4)} 有限公司`,
    businessType: companyTypes[typeIndex],
    registrationDate: '2020-01-15',
    expiryDate: '2025-01-14',
    message: 'Business Registration verified successfully.',
  };
}

/**
 * Validate Hong Kong ID Card format and checksum
 * 
 * @param idNumber - HKID in format A123456(7)
 * @returns boolean indicating if format is valid
 */
export function validateHKIDFormat(idNumber: string): boolean {
  // HKID format: 1-2 letters + 6 digits + check digit in parentheses
  const hkidRegex = /^[A-Z]{1,2}\d{6}\(\d\)$/;
  if (!hkidRegex.test(idNumber.toUpperCase())) {
    return false;
  }

  // Validate checksum
  // The check digit algorithm:
  // 1. Convert letters to numbers (A=1, B=2, ..., Z=26)
  // 2. For 1-letter IDs, use 36 as the first multiplier
  // 3. Multiply each digit by decreasing weights (9, 8, 7, 6, 5, 4, 3, 2)
  // 4. Sum and calculate remainder when divided by 11
  // 5. Check digit = 11 - remainder (0 becomes A, 1 becomes 0)

  const cleanId = idNumber.toUpperCase().replace(/[()]/g, '');
  const letters = cleanId.match(/^[A-Z]+/)?.[0] || '';
  const digits = cleanId.match(/\d+/g)?.join('') || '';
  const checkDigit = parseInt(digits.slice(-1));

  let sum = 0;
  let weight = 9;

  // Add letter values
  for (let i = 0; i < letters.length; i++) {
    sum += (letters.charCodeAt(i) - 64) * weight;
    weight--;
  }

  // If single letter, add 36 * weight for position 1
  if (letters.length === 1) {
    sum += 36 * 8;
    weight = 7;
  }

  // Add digit values
  for (let i = 0; i < digits.length - 1; i++) {
    sum += parseInt(digits[i]) * weight;
    weight--;
  }

  const remainder = sum % 11;
  let calculatedCheckDigit: number | string = 11 - remainder;
  
  if (calculatedCheckDigit === 11) calculatedCheckDigit = 0;
  if (calculatedCheckDigit === 10) calculatedCheckDigit = 'A';

  return calculatedCheckDigit === checkDigit || 
         (typeof calculatedCheckDigit === 'string' && calculatedCheckDigit === 'A' && checkDigit === 10);
}

// ============ Export Types and Functions ============

export default {
  submitApplication,
  checkStatus,
  verifyBRNumber,
  validateHKIDFormat,
};
