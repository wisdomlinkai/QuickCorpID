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
import { handleSignUp, handleSignIn, handleRefreshToken, handleGetProfile, handleUpdateProfile, handleSignOut } from './handlers';
/**
 * Main Lambda handler
 */
export declare function handler(event: APIGatewayEvent): Promise<APIGatewayResponse>;
export { handleSignUp, handleSignIn, handleRefreshToken, handleGetProfile, handleUpdateProfile, handleSignOut };
