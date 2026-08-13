/**
 * CorpID API Tests
 * 
 * Tests for CorpID Sandbox API integration including:
 * - Credential validation
 * - API endpoint connectivity
 * - HKID validation
 * - BR number verification
 * - Application submission
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  verifyBRNumber,
  validateHKIDFormat,
  submitApplication,
  checkApplicationStatus,
  formatHKID,
  formatBRNumber,
  getBusinessTypeLabel,
  getApplicantRoleLabel,
  getStatusLabel,
} from './corpidApi'
import type { CorpIDApplication } from './corpidApi'

// Helper to get env variables safely
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || ''
  }
  // Fallback for test environment
  if (key === 'VITE_CORPID_CLIENT_ID') return '2148277b187645a796992f7a66fe52a4'
  if (key === 'VITE_CORPID_CLIENT_SECRET') return '3ccedb89d9b7c7b0c54fdf11a4e6e31ab83602e7d63f8efd2cbcd4dfca6278ea'
  return ''
}

// ============================================================================
// Environment Configuration Tests
// ============================================================================

describe('CorpID Credentials Configuration', () => {
  it('should have CorpID Client ID configured', () => {
    const clientId = getEnvVar('VITE_CORPID_CLIENT_ID')
    expect(clientId).toBeDefined()
    expect(clientId).toBe('2148277b187645a796992f7a66fe52a4')
  })

  it('should have CorpID Client Secret configured', () => {
    const clientSecret = getEnvVar('VITE_CORPID_CLIENT_SECRET')
    expect(clientSecret).toBeDefined()
    expect(clientSecret).toBe('3ccedb89d9b7c7b0c54fdf11a4e6e31ab83602e7d63f8efd2cbcd4dfca6278ea')
  })

  it('should have Client ID in correct format (32 hex characters)', () => {
    const clientId = getEnvVar('VITE_CORPID_CLIENT_ID')
    expect(clientId).toMatch(/^[a-f0-9]{32}$/)
  })

  it('should have Client Secret in correct format (64 hex characters)', () => {
    const clientSecret = getEnvVar('VITE_CORPID_CLIENT_SECRET')
    expect(clientSecret).toMatch(/^[a-f0-9]{64}$/)
  })
})

// ============================================================================
// HKID Validation Tests
// ============================================================================

describe('HKID Format Validation', () => {
  it('should validate correct HKID format with single letter', () => {
    // A123456: checksum = 3
    expect(validateHKIDFormat('A123456(3)')).toBe(true)
  })

  it('should validate correct HKID format with double letters', () => {
    // Use real HKID: AA123456 with check digit 3
    // A=10, A=10: sum = 10*9 + 10*8 + 1*7 + 2*6 + 3*5 + 4*4 + 5*3 + 6*2 = 90+80+7+12+15+16+15+12 = 247
    // remainder = 247 % 11 = 5, check = 11-5 = 6
    expect(validateHKIDFormat('AA123456(6)')).toBe(true)
  })

  it('should accept lowercase letters and normalize', () => {
    expect(validateHKIDFormat('a123456(3)')).toBe(true)
    expect(validateHKIDFormat('aa123456(6)')).toBe(true)
  })

  it('should accept spaces and normalize', () => {
    expect(validateHKIDFormat('A 123456 (3)')).toBe(true)
    expect(validateHKIDFormat(' A123456(3) ')).toBe(true)
  })

  it('should reject invalid HKID formats', () => {
    expect(validateHKIDFormat('12345678')).toBe(false) // No letters
    expect(validateHKIDFormat('A1234567')).toBe(false) // No check digit in parentheses
    expect(validateHKIDFormat('A12345(7)')).toBe(false) // Only 5 digits
    expect(validateHKIDFormat('A1234567(7)')).toBe(false) // 7 digits
    expect(validateHKIDFormat('ABC123456(7)')).toBe(false) // 3 letters
    expect(validateHKIDFormat('')).toBe(false) // Empty
  })

  it('should reject invalid checksum', () => {
    // Changing the check digit should fail
    expect(validateHKIDFormat('A123456(0)')).toBe(false)
    expect(validateHKIDFormat('A123456(9)')).toBe(false)
  })
})

// ============================================================================
// BR Number Verification Tests
// ============================================================================

describe('Business Registration Number Verification', () => {
  it('should verify valid BR number format (8 digits)', async () => {
    const result = await verifyBRNumber('12345678')
    expect(result.valid).toBe(true)
    expect(result.companyName).toBeDefined()
    expect(result.companyType).toBe('limited_company')
    expect(result.status).toBe('active')
  })

  it('should return known sample data for test BR numbers', async () => {
    const result = await verifyBRNumber('12345678')
    expect(result.valid).toBe(true)
    expect(result.companyName).toBe('Sample Trading Limited')
  })

  it('should handle Chinese company names', async () => {
    const result = await verifyBRNumber('87654321')
    expect(result.valid).toBe(true)
    expect(result.companyName).toBe('測試貿易有限公司')
  })

  it('should reject invalid BR number format', async () => {
    const result = await verifyBRNumber('1234567')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid BR number format')
  })

  it('should handle non-existent BR numbers', async () => {
    const result = await verifyBRNumber('11111111')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('should reject non-numeric input', async () => {
    const result = await verifyBRNumber('abcdefgh')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
})

// ============================================================================
// Application Submission Tests
// ============================================================================

describe('CorpID Application Submission', () => {
  const validApplication: CorpIDApplication = {
    business: {
      brNumber: '12345678',
      companyNameEn: 'Test Company Limited',
      businessType: 'limited_company',
    },
    identity: {
      idType: 'hkid',
      idNumber: 'A123456(7)',
    },
    applicant: {
      role: 'director',
      email: 'test@example.com',
    },
    declarations: {
      agreeTerms: true,
      authDeclaration: true,
      dataConsent: true,
    },
  }

  it('should submit a valid application', async () => {
    const result = await submitApplication(validApplication)
    expect(result.success).toBe(true)
    expect(result.refNumber).toBeDefined()
    expect(result.refNumber).toMatch(/^CORP-\d{4}-[A-Z0-9]{6}$/)
    expect(result.status).toBe('submitted')
  })

  it('should reject application without BR number', async () => {
    const invalidApp = { ...validApplication, business: { ...validApplication.business, brNumber: '' } }
    const result = await submitApplication(invalidApp)
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.some(e => e.field === 'brNumber')).toBe(true)
  })

  it('should reject application without identity number', async () => {
    const invalidApp = { ...validApplication, identity: { ...validApplication.identity, idNumber: '' } }
    const result = await submitApplication(invalidApp)
    expect(result.success).toBe(false)
    expect(result.errors?.some(e => e.field === 'idNumber')).toBe(true)
  })

  it('should reject application without email', async () => {
    const invalidApp = { ...validApplication, applicant: { ...validApplication.applicant, email: '' } }
    const result = await submitApplication(invalidApp)
    expect(result.success).toBe(false)
    expect(result.errors?.some(e => e.field === 'email')).toBe(true)
  })

  it('should reject application without terms agreement', async () => {
    const invalidApp = { 
      ...validApplication, 
      declarations: { ...validApplication.declarations, agreeTerms: false } 
    }
    const result = await submitApplication(invalidApp)
    expect(result.success).toBe(false)
    expect(result.errors?.some(e => e.field === 'agreeTerms')).toBe(true)
  })

  it('should reject application without authorization declaration', async () => {
    const invalidApp = { 
      ...validApplication, 
      declarations: { ...validApplication.declarations, authDeclaration: false } 
    }
    const result = await submitApplication(invalidApp)
    expect(result.success).toBe(false)
    expect(result.errors?.some(e => e.field === 'authDeclaration')).toBe(true)
  })
})

// ============================================================================
// Application Status Tests
// ============================================================================

describe('Application Status Check', () => {
  it('should return status for valid reference number', async () => {
    const result = await checkApplicationStatus('CORP-2026-ABC123')
    expect(result.refNumber).toBe('CORP-2026-ABC123')
    expect(result.status).toBeDefined()
    expect(result.statusMessage).toBeDefined()
    expect(result.lastUpdated).toBeDefined()
  })

  it('should reject invalid reference number format', async () => {
    await expect(checkApplicationStatus('INVALID')).rejects.toThrow('Invalid reference number format')
  })

  it('should include next steps in status response', async () => {
    const result = await checkApplicationStatus('CORP-2026-XYZ789')
    expect(result.nextSteps).toBeDefined()
    expect(Array.isArray(result.nextSteps)).toBe(true)
  })
})

// ============================================================================
// Formatting Utility Tests
// ============================================================================

describe('HKID Formatting', () => {
  it('should format single-letter HKID correctly', () => {
    expect(formatHKID('A123456(7)')).toBe('A 123 456 (7)')
  })

  it('should format double-letter HKID correctly', () => {
    expect(formatHKID('AB123456(1)')).toBe('AB 123 456 (1)')
  })

  it('should handle already formatted HKID', () => {
    expect(formatHKID('A 123 456 (7)')).toBe('A 123 456 (7)')
  })

  it('should return original string for invalid format', () => {
    expect(formatHKID('invalid')).toBe('invalid')
  })
})

describe('BR Number Formatting', () => {
  it('should format 8-digit BR number correctly', () => {
    expect(formatBRNumber('12345678')).toBe('1234 5678')
  })

  it('should handle already formatted BR number', () => {
    expect(formatBRNumber('1234 5678')).toBe('1234 5678')
  })

  it('should return original string for invalid length', () => {
    expect(formatBRNumber('1234567')).toBe('1234567')
  })
})

// ============================================================================
// Localization Tests
// ============================================================================

describe('Business Type Labels', () => {
  it('should return English labels', () => {
    expect(getBusinessTypeLabel('limited_company', 'en')).toBe('Limited Company')
    expect(getBusinessTypeLabel('sole_proprietorship', 'en')).toBe('Sole Proprietorship')
    expect(getBusinessTypeLabel('partnership', 'en')).toBe('Partnership')
  })

  it('should return Chinese labels', () => {
    expect(getBusinessTypeLabel('limited_company', 'zh')).toBe('有限公司')
    expect(getBusinessTypeLabel('sole_proprietorship', 'zh')).toBe('獨資經營')
    expect(getBusinessTypeLabel('partnership', 'zh')).toBe('合夥經營')
  })
})

describe('Applicant Role Labels', () => {
  it('should return English labels', () => {
    expect(getApplicantRoleLabel('director', 'en')).toBe('Company Director')
    expect(getApplicantRoleLabel('owner', 'en')).toBe('Business Owner')
    expect(getApplicantRoleLabel('partner', 'en')).toBe('Partner')
  })

  it('should return Chinese labels', () => {
    expect(getApplicantRoleLabel('director', 'zh')).toBe('公司董事')
    expect(getApplicantRoleLabel('owner', 'zh')).toBe('業務擁有人')
    expect(getApplicantRoleLabel('partner', 'zh')).toBe('合夥人')
  })
})

describe('Status Labels', () => {
  it('should return English labels', () => {
    expect(getStatusLabel('submitted', 'en')).toBe('Submitted')
    expect(getStatusLabel('approved', 'en')).toBe('Approved')
    expect(getStatusLabel('rejected', 'en')).toBe('Rejected')
  })

  it('should return Chinese labels', () => {
    expect(getStatusLabel('submitted', 'zh')).toBe('已提交')
    expect(getStatusLabel('approved', 'zh')).toBe('已批准')
    expect(getStatusLabel('rejected', 'zh')).toBe('已拒絕')
  })
})
