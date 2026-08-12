/**
 * QuickCorpID Auth Service - Lambda Entry Point
 * 
 * API Gateway handler for authentication endpoints
 * 
 * Routes:
 *   POST /auth/signup           - Sign up
 *   POST /auth/signin           - Sign in
 *   POST /auth/refresh          - Refresh tokens
 *   POST /auth/logout           - Sign out
 *   GET  /auth/me               - Get profile
 *   PUT  /auth/me               - Update profile
 *   POST /auth/forgot-password  - Forgot password
 */

import type { APIGatewayEvent, APIGatewayResponse } from './types';
import {
  handleSignUp,
  handleSignIn,
  handleRefreshToken,
  handleGetProfile,
  handleUpdateProfile,
  handleSignOut,
  handleForgotPassword,
} from './handlers';

// Route mapping
const routes: Record<string, Record<string, (event: APIGatewayEvent) => Promise<APIGatewayResponse>>> = {
  '/auth/signup': { POST: handleSignUp },
  '/auth/signin': { POST: handleSignIn },
  '/auth/refresh': { POST: handleRefreshToken },
  '/auth/logout': { POST: handleSignOut },
  '/auth/me': { GET: handleGetProfile, PUT: handleUpdateProfile },
  '/auth/forgot-password': { POST: handleForgotPassword },
};

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: '',
    };
  }

  // Find route handler
  const route = routes[event.path];
  if (!route) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };
  }

  const handler = route[event.httpMethod];
  if (!handler) {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Execute handler
  return handler(event);
}

// Export for testing
export { handleSignUp, handleSignIn, handleRefreshToken, handleGetProfile, handleUpdateProfile, handleSignOut };
