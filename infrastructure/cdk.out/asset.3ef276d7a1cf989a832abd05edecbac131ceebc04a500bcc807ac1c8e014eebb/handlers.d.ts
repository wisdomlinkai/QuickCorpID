/**
 * QuickCorpID Auth Service - Lambda Handlers
 *
 * API Gateway Lambda handlers for authentication endpoints
 */
import type { APIGatewayEvent, APIGatewayResponse } from './types';
export declare function handleSignUp(event: APIGatewayEvent): Promise<APIGatewayResponse>;
export declare function handleSignIn(event: APIGatewayEvent): Promise<APIGatewayResponse>;
export declare function handleRefreshToken(event: APIGatewayEvent): Promise<APIGatewayResponse>;
export declare function handleGetProfile(event: APIGatewayEvent): Promise<APIGatewayResponse>;
export declare function handleUpdateProfile(event: APIGatewayEvent): Promise<APIGatewayResponse>;
export declare function handleSignOut(event: APIGatewayEvent): Promise<APIGatewayResponse>;
export declare function handleForgotPassword(event: APIGatewayEvent): Promise<APIGatewayResponse>;
