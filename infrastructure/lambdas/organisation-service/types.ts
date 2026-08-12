import { z } from 'zod';

// Organisation types
export const CreateOrganisationSchema = z.object({
  name: z.string().min(1).max(255),
  br_number: z.string().length(8, 'BR number must be exactly 8 characters'),
  business_type: z.enum(['limited_company', 'partnership', 'sole_proprietorship', 'other']),
  cr_number: z.string().optional(),
});

export const UpdateOrganisationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  business_type: z.enum(['limited_company', 'partnership', 'sole_proprietorship', 'other']).optional(),
  status: z.enum(['pending', 'active', 'suspended', 'closed']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'authorised_rep', 'viewer']),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'authorised_rep', 'viewer']),
});

// Types
export type CreateOrganisationRequest = z.infer<typeof CreateOrganisationSchema>;
export type UpdateOrganisationRequest = z.infer<typeof UpdateOrganisationSchema>;
export type InviteMemberRequest = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleSchema>;

export interface Organisation {
  id: string;
  name: string;
  br_number: string;
  cr_number: string | null;
  corpid_identifier: string | null;
  business_type: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface OrganisationMember {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  status: string;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface OrganisationWithMembership extends Organisation {
  member_count?: number;
  corpid_connected?: boolean;
  user_role?: string;
}

// API Response types
export interface ApiResponse<T> {
  statusCode: number;
  body: T;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

export interface ListResponse<T> {
  items: T[];
  nextToken?: string;
  count: number;
}

// Lambda event types
export interface ApiGatewayEvent {
  httpMethod: string;
  path: string;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
  requestContext: {
    authorizer?: {
      claims: {
        sub: string;
        email: string;
        'cognito:username'?: string;
      };
    };
  };
}
