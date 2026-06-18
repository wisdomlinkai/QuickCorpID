/**
 * AWS Backend Configuration for QuickCorpID
 * 
 * This module provides AWS service clients using AWS Amplify v6.
 * Services used:
 * - Amazon Cognito: User authentication
 * - Amazon S3: Document storage
 * - REST API: Application data (can be backed by API Gateway + Lambda + DynamoDB)
 * 
 * @module lib/aws
 * @requires aws-amplify
 */

import { Amplify } from 'aws-amplify';
import { signIn, signUp, signOut, getCurrentUser, resetPassword } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';

// ============ Type Definitions ============

export type ApplicationStatus = 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  br_number: string;
  company_name_en?: string;
  company_name_zh?: string;
  business_type: string;
  id_type: 'hkid' | 'passport';
  id_number: string;
  document_url?: string;
  applicant_role: 'owner' | 'employee' | 'agent';
  applicant_email: string;
  applicant_phone?: string;
  status: ApplicationStatus;
  ref_number?: string;
  corp_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
}

export interface ApplicationInsert {
  user_id: string;
  br_number: string;
  company_name_en?: string;
  company_name_zh?: string;
  business_type: string;
  id_type: 'hkid' | 'passport';
  id_number: string;
  document_url?: string;
  applicant_role: 'owner' | 'employee' | 'agent';
  applicant_email: string;
  applicant_phone?: string;
  status?: ApplicationStatus;
}

export interface ApplicationUpdate {
  br_number?: string;
  company_name_en?: string;
  company_name_zh?: string;
  business_type?: string;
  id_type?: 'hkid' | 'passport';
  id_number?: string;
  document_url?: string;
  applicant_role?: 'owner' | 'employee' | 'agent';
  applicant_email?: string;
  applicant_phone?: string;
  status?: ApplicationStatus;
  ref_number?: string;
  corp_id?: string;
  notes?: string;
  submitted_at?: string;
  approved_at?: string;
}

// ============ Amplify Configuration ============

let isConfigured = false;

/**
 * Configure AWS Amplify with environment variables
 */
export function configureAmplify(): boolean {
  if (isConfigured) return true;

  const region = import.meta.env.VITE_AWS_REGION || 'ap-east-1';
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
  const s3Bucket = import.meta.env.VITE_S3_BUCKET;

  if (!userPoolId || !userPoolClientId) {
    console.warn(
      'AWS Cognito credentials not found. Please set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in your .env file.'
    );
    return false;
  }

  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          identityPoolId: identityPoolId || undefined,
        },
      },
      Storage: {
        S3: {
          bucket: s3Bucket || 'quickcorpid-documents',
          region,
        },
      },
    });

    isConfigured = true;
    return true;
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
    return false;
  }
}

// ============ Authentication Helpers ============

/**
 * Get the current authenticated user
 */
export async function getCurrentAuthenticatedUser() {
  try {
    const user = await getCurrentUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Sign up a new user with email and password
 */
export async function signUpUser(email: string, password: string, metadata?: Record<string, unknown>) {
  try {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          ...(metadata?.full_name ? { name: metadata.full_name as string } : {}),
        },
      },
    });
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Sign in with email and password
 */
export async function signInUser(email: string, password: string) {
  try {
    const result = await signIn({
      username: email,
      password,
    });
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
  try {
    await signOut();
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Reset password via email
 */
export async function resetUserPassword(email: string) {
  try {
    await resetPassword({ username: email });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// ============ Database Operations (localStorage fallback) ============
// Note: In production, replace localStorage with API Gateway + Lambda + DynamoDB

/**
 * Create or update user profile
 */
export async function upsertProfile(profile: { id: string; email: string; phone?: string; full_name?: string }) {
  const profiles = JSON.parse(localStorage.getItem('aws_profiles') || '{}');
  profiles[profile.id] = {
    ...profile,
    created_at: profiles[profile.id]?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem('aws_profiles', JSON.stringify(profiles));
  return { data: profiles[profile.id] as UserProfile, error: null };
}

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string) {
  const profiles = JSON.parse(localStorage.getItem('aws_profiles') || '{}');
  return { data: (profiles[userId] as UserProfile) || null, error: null };
}

/**
 * Create a new application
 */
export async function createApplication(application: ApplicationInsert): Promise<{ data: Application | null; error: Error | null }> {
  const newApp: Application = {
    id: crypto.randomUUID(),
    ...application,
    status: application.status || 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const applications = JSON.parse(localStorage.getItem('aws_applications') || '[]');
  applications.push(newApp);
  localStorage.setItem('aws_applications', JSON.stringify(applications));
  
  return { data: newApp, error: null };
}

/**
 * Get application by ID
 */
export async function getApplication(applicationId: string): Promise<{ data: Application | null; error: Error | null }> {
  const applications = JSON.parse(localStorage.getItem('aws_applications') || '[]');
  const app = applications.find((a: Application) => a.id === applicationId);
  return { data: app || null, error: null };
}

/**
 * Get all applications for a user
 */
export async function getUserApplications(userId: string): Promise<{ data: Application[] | null; error: Error | null }> {
  const applications = JSON.parse(localStorage.getItem('aws_applications') || '[]');
  const userApps = applications.filter((a: Application) => a.user_id === userId);
  return { data: userApps, error: null };
}

/**
 * Update an application
 */
export async function updateApplication(applicationId: string, updates: ApplicationUpdate): Promise<{ data: Application | null; error: Error | null }> {
  const applications = JSON.parse(localStorage.getItem('aws_applications') || '[]');
  const index = applications.findIndex((a: Application) => a.id === applicationId);
  
  if (index !== -1) {
    applications[index] = {
      ...applications[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('aws_applications', JSON.stringify(applications));
    return { data: applications[index], error: null };
  }
  
  return { data: null, error: new Error('Application not found') };
}

/**
 * Submit an application (change status from draft to submitted)
 */
export async function submitApplicationDb(applicationId: string, refNumber: string) {
  return updateApplication(applicationId, {
    status: 'submitted',
    ref_number: refNumber,
    submitted_at: new Date().toISOString(),
  });
}

/**
 * Delete a draft application
 */
export async function deleteApplication(applicationId: string): Promise<{ error: Error | null }> {
  const applications = JSON.parse(localStorage.getItem('aws_applications') || '[]');
  const filtered = applications.filter((a: Application) => a.id !== applicationId);
  localStorage.setItem('aws_applications', JSON.stringify(filtered));
  return { error: null };
}

// ============ Storage Operations (S3) ============

/**
 * Upload a document to S3
 */
export async function uploadDocument(userId: string, file: File): Promise<{ data: { path: string; publicUrl: string } | null; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    await uploadData({
      key: fileName,
      data: file,
      options: {
        accessLevel: 'protected',
        contentType: file.type,
      },
    }).result;

    const publicUrl = `https://${import.meta.env.VITE_S3_BUCKET}.s3.${import.meta.env.VITE_AWS_REGION || 'ap-east-1'}.amazonaws.com/${fileName}`;

    return { data: { path: fileName, publicUrl }, error: null };
  } catch (error) {
    // Fallback: Store as base64 in localStorage (for demo purposes)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const localPath = `local://${userId}/${Date.now()}.${file.name.split('.').pop()}`;
        const localDocs = JSON.parse(localStorage.getItem('aws_documents') || '{}');
        localDocs[localPath] = base64;
        localStorage.setItem('aws_documents', JSON.stringify(localDocs));
        resolve({ data: { path: localPath, publicUrl: localPath }, error: null });
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Get a document from S3
 */
export async function getDocument(path: string): Promise<{ data: string | null; error: Error | null }> {
  try {
    const result = await getUrl({
      key: path,
      options: {
        accessLevel: 'protected',
      },
    });
    return { data: result.url.toString(), error: null };
  } catch {
    // Fallback to localStorage
    const localDocs = JSON.parse(localStorage.getItem('aws_documents') || '{}');
    return { data: localDocs[path] || null, error: null };
  }
}

// ============ Real-time Subscriptions ============

/**
 * Subscribe to application changes
 * Note: This is a placeholder - real implementation would use AppSync subscriptions
 */
export function subscribeToApplication(applicationId: string, callback: (application: Application) => void) {
  let lastUpdated = '';
  const interval = setInterval(async () => {
    try {
      const { data } = await getApplication(applicationId);
      if (data && data.updated_at !== lastUpdated) {
        lastUpdated = data.updated_at;
        callback(data);
      }
    } catch {
      // Ignore errors in polling
    }
  }, 5000);

  return {
    unsubscribe: () => clearInterval(interval),
  };
}
