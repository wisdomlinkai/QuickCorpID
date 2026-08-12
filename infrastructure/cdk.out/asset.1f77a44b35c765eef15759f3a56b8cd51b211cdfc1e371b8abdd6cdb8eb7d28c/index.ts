import { APIGatewayProxyResult } from 'aws-lambda';
import { 
  ApiGatewayEvent, 
  CreateOrganisationSchema, 
  UpdateOrganisationSchema, 
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  ApiResponse,
  ErrorResponse 
} from './types';
import * as db from './database';

// Helper functions
function getResponseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function successResponse<T>(statusCode: number, data: T): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getResponseHeaders(),
    body: JSON.stringify(data),
  };
}

function errorResponse(statusCode: number, message: string, details?: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getResponseHeaders(),
    body: JSON.stringify({ error: 'Error', message, details } as ErrorResponse),
  };
}

function getUserIdFromEvent(event: ApiGatewayEvent): string | null {
  return event.requestContext.authorizer?.claims?.sub || null;
}

function getUserEmailFromEvent(event: ApiGatewayEvent): string | null {
  return event.requestContext.authorizer?.claims?.email || null;
}

function parseBody<T>(body: string | undefined): T | null {
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

// Route handlers
async function handleCreateOrganisation(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  const body = parseBody<unknown>(event.body);
  if (!body) {
    return errorResponse(400, 'Invalid request body');
  }
  
  const validation = CreateOrganisationSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(400, 'Validation failed', validation.error.errors);
  }
  
  try {
    // Ensure user exists in database
    const user = await db.createUser(cognitoSub, email);
    
    const organisation = await db.createOrganisation(user.id, validation.data);
    
    return successResponse(201, organisation);
  } catch (error) {
    console.error('Error creating organisation:', error);
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return errorResponse(409, 'An organisation with this BR number already exists');
      }
      return errorResponse(500, error.message);
    }
    return errorResponse(500, 'Failed to create organisation');
  }
}

async function handleListOrganisations(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  try {
    // Ensure user exists
    const user = await db.createUser(cognitoSub, email);
    
    const organisations = await db.listUserOrganisations(user.id);
    
    return successResponse(200, { items: organisations, count: organisations.length });
  } catch (error) {
    console.error('Error listing organisations:', error);
    return errorResponse(500, 'Failed to list organisations');
  }
}

async function handleGetOrganisation(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  const orgId = event.pathParameters?.orgId;
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  if (!orgId) {
    return errorResponse(400, 'Organisation ID is required');
  }
  
  try {
    const user = await db.createUser(cognitoSub, email);
    const organisation = await db.getOrganisation(orgId, user.id);
    
    if (!organisation) {
      return errorResponse(404, 'Organisation not found');
    }
    
    return successResponse(200, organisation);
  } catch (error) {
    console.error('Error getting organisation:', error);
    return errorResponse(500, 'Failed to get organisation');
  }
}

async function handleUpdateOrganisation(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  const orgId = event.pathParameters?.orgId;
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  if (!orgId) {
    return errorResponse(400, 'Organisation ID is required');
  }
  
  const body = parseBody<unknown>(event.body);
  if (!body) {
    return errorResponse(400, 'Invalid request body');
  }
  
  const validation = UpdateOrganisationSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(400, 'Validation failed', validation.error.errors);
  }
  
  try {
    const user = await db.createUser(cognitoSub, email);
    const organisation = await db.updateOrganisation(orgId, user.id, validation.data);
    
    if (!organisation) {
      return errorResponse(404, 'Organisation not found or insufficient permissions');
    }
    
    return successResponse(200, organisation);
  } catch (error) {
    console.error('Error updating organisation:', error);
    return errorResponse(500, 'Failed to update organisation');
  }
}

async function handleDeleteOrganisation(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  const orgId = event.pathParameters?.orgId;
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  if (!orgId) {
    return errorResponse(400, 'Organisation ID is required');
  }
  
  try {
    const user = await db.createUser(cognitoSub, email);
    const deleted = await db.deleteOrganisation(orgId, user.id);
    
    if (!deleted) {
      return errorResponse(404, 'Organisation not found or insufficient permissions');
    }
    
    return successResponse(200, { message: 'Organisation deleted successfully' });
  } catch (error) {
    console.error('Error deleting organisation:', error);
    return errorResponse(500, 'Failed to delete organisation');
  }
}

// Member handlers
async function handleInviteMember(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  const orgId = event.pathParameters?.orgId;
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  if (!orgId) {
    return errorResponse(400, 'Organisation ID is required');
  }
  
  const body = parseBody<unknown>(event.body);
  if (!body) {
    return errorResponse(400, 'Invalid request body');
  }
  
  const validation = InviteMemberSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(400, 'Validation failed', validation.error.errors);
  }
  
  try {
    const user = await db.createUser(cognitoSub, email);
    const member = await db.inviteMember(orgId, user.id, validation.data);
    
    return successResponse(201, member);
  } catch (error) {
    console.error('Error inviting member:', error);
    if (error instanceof Error) {
      if (error.message.includes('Insufficient permissions')) {
        return errorResponse(403, error.message);
      }
      if (error.message.includes('already a member')) {
        return errorResponse(409, error.message);
      }
      return errorResponse(500, error.message);
    }
    return errorResponse(500, 'Failed to invite member');
  }
}

async function handleListMembers(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  const orgId = event.pathParameters?.orgId;
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  if (!orgId) {
    return errorResponse(400, 'Organisation ID is required');
  }
  
  try {
    const user = await db.createUser(cognitoSub, email);
    const members = await db.listOrganisationMembers(orgId, user.id);
    
    return successResponse(200, { items: members, count: members.length });
  } catch (error) {
    console.error('Error listing members:', error);
    return errorResponse(500, 'Failed to list members');
  }
}

async function handleUpdateMemberRole(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  const orgId = event.pathParameters?.orgId;
  const memberId = event.pathParameters?.memberId;
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  if (!orgId || !memberId) {
    return errorResponse(400, 'Organisation ID and Member ID are required');
  }
  
  const body = parseBody<unknown>(event.body);
  if (!body) {
    return errorResponse(400, 'Invalid request body');
  }
  
  const validation = UpdateMemberRoleSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(400, 'Validation failed', validation.error.errors);
  }
  
  try {
    const user = await db.createUser(cognitoSub, email);
    const member = await db.updateMemberRole(orgId, memberId, user.id, validation.data.role);
    
    if (!member) {
      return errorResponse(404, 'Member not found');
    }
    
    return successResponse(200, member);
  } catch (error) {
    console.error('Error updating member role:', error);
    if (error instanceof Error) {
      if (error.message.includes('Insufficient permissions')) {
        return errorResponse(403, error.message);
      }
      return errorResponse(500, error.message);
    }
    return errorResponse(500, 'Failed to update member role');
  }
}

async function handleRemoveMember(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const cognitoSub = getUserIdFromEvent(event);
  const email = getUserEmailFromEvent(event);
  const orgId = event.pathParameters?.orgId;
  const memberId = event.pathParameters?.memberId;
  
  if (!cognitoSub || !email) {
    return errorResponse(401, 'Unauthorized');
  }
  
  if (!orgId || !memberId) {
    return errorResponse(400, 'Organisation ID and Member ID are required');
  }
  
  try {
    const user = await db.createUser(cognitoSub, email);
    const removed = await db.removeMember(orgId, memberId, user.id);
    
    if (!removed) {
      return errorResponse(404, 'Member not found');
    }
    
    return successResponse(200, { message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    if (error instanceof Error) {
      if (error.message.includes('Insufficient permissions')) {
        return errorResponse(403, error.message);
      }
      if (error.message.includes('last owner')) {
        return errorResponse(400, error.message);
      }
      return errorResponse(500, error.message);
    }
    return errorResponse(500, 'Failed to remove member');
  }
}

// Router
function route(event: ApiGatewayEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;
  const pathParts = path.split('/').filter(Boolean);
  
  // Route: /organisations
  if (path.endsWith('/organisations')) {
    if (httpMethod === 'POST') return handleCreateOrganisation(event);
    if (httpMethod === 'GET') return handleListOrganisations(event);
  }
  
  // Route: /organisations/{orgId}
  if (pathParts.length === 2 && pathParts[0] === 'organisations') {
    if (httpMethod === 'GET') return handleGetOrganisation(event);
    if (httpMethod === 'PUT') return handleUpdateOrganisation(event);
    if (httpMethod === 'DELETE') return handleDeleteOrganisation(event);
  }
  
  // Route: /organisations/{orgId}/members
  if (path.endsWith('/members')) {
    if (httpMethod === 'POST') return handleInviteMember(event);
    if (httpMethod === 'GET') return handleListMembers(event);
  }
  
  // Route: /organisations/{orgId}/members/{memberId}
  if (pathParts.length === 4 && pathParts[0] === 'organisations' && pathParts[2] === 'members') {
    if (httpMethod === 'PUT') return handleUpdateMemberRole(event);
    if (httpMethod === 'DELETE') return handleRemoveMember(event);
  }
  
  return Promise.resolve(errorResponse(404, 'Not found'));
}

// Lambda handler
export const handler = async (event: ApiGatewayEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getResponseHeaders(),
        body: '',
      };
    }
    
    const result = await route(event);
    return result;
  } catch (error) {
    console.error('Unhandled error:', error);
    return errorResponse(500, 'Internal server error');
  } finally {
    await db.closeDatabaseClient().catch(console.error);
  }
};
