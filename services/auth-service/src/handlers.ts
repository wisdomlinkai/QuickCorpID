/**
 * QuickCorpID Auth Service - Lambda Handlers
 * 
 * API Gateway Lambda handlers for authentication endpoints
 */

import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { APIGatewayEvent, APIGatewayResponse } from './types';
import {
  SignUpRequestSchema,
  SignInRequestSchema,
  RefreshTokenRequestSchema,
  UpdateProfileRequestSchema,
  getEnvironmentConfig,
} from './types';
import * as cognito from './cognito';
import * as db from './database';

// ============================================================================
// PowerTools Setup
// ============================================================================

const logger = new Logger({ serviceName: 'auth-service' });
const metrics = new Metrics({ namespace: 'QuickCorpID/Auth' });
const tracer = new Tracer({ serviceName: 'auth-service' });

// ============================================================================
// Helper Functions
// ============================================================================

function jsonResponse(statusCode: number, body: unknown): APIGatewayResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function parseBody<T>(event: APIGatewayEvent): T {
  if (!event.body) {
    throw new Error('Request body is required');
  }
  return JSON.parse(event.body) as T;
}

// ============================================================================
// Handler: Sign Up
// ============================================================================

export async function handleSignUp(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  try {
    const config = getEnvironmentConfig();
    const body = parseBody(event);
    const request = SignUpRequestSchema.parse(body);

    logger.info('Sign up request', { email: request.email });

    // Create Cognito user
    const result = await cognito.signUp(
      request.email,
      request.password,
      request.fullName,
      config,
      request.phone
    );

    // Create database record
    await db.createUser(
      result.userSub,
      request.email,
      request.fullName,
      request.phone,
      request.preferredLanguage
    );

    metrics.addMetric('SignUpSuccess', 'Count', 1);

    return jsonResponse(201, {
      success: true,
      data: {
        user: {
          userId: result.userSub,
          email: request.email,
          confirmed: result.confirmed,
        },
      },
    });
  } catch (error) {
    logger.error('Sign up failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    metrics.addMetric('SignUpFailed', 'Count', 1);

    return jsonResponse(400, {
      success: false,
      error: {
        code: 'SIGNUP_FAILED',
        message: error instanceof Error ? error.message : 'Sign up failed',
      },
    });
  }
}

// ============================================================================
// Handler: Sign In
// ============================================================================

export async function handleSignIn(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  try {
    const config = getEnvironmentConfig();
    const body = parseBody(event);
    const request = SignInRequestSchema.parse(body);

    logger.info('Sign in request', { email: request.email });

    const result = await cognito.signIn(request.email, request.password, config);

    // Handle NEW_PASSWORD_REQUIRED challenge
    if (result.challengeName) {
      return jsonResponse(200, {
        success: false,
        data: {
          challengeName: result.challengeName,
          challengeParameters: result.challengeParameters,
        },
      });
    }

    metrics.addMetric('SignInSuccess', 'Count', 1);

    return jsonResponse(200, {
      success: true,
      data: {
        tokens: {
          accessToken: result.accessToken,
          idToken: result.idToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          tokenType: 'Bearer',
        },
      },
    });
  } catch (error) {
    logger.error('Sign in failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    metrics.addMetric('SignInFailed', 'Count', 1);

    return jsonResponse(401, {
      success: false,
      error: {
        code: 'SIGNIN_FAILED',
        message: 'Invalid email or password',
      },
    });
  }
}

// ============================================================================
// Handler: Refresh Token
// ============================================================================

export async function handleRefreshToken(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  try {
    const config = getEnvironmentConfig();
    const body = parseBody(event);
    const request = RefreshTokenRequestSchema.parse(body);

    const result = await cognito.refreshTokens(request.refreshToken, config);

    metrics.addMetric('TokenRefreshSuccess', 'Count', 1);

    return jsonResponse(200, {
      success: true,
      data: {
        tokens: {
          accessToken: result.accessToken,
          idToken: result.idToken,
          expiresIn: result.expiresIn,
          tokenType: 'Bearer',
        },
      },
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    metrics.addMetric('TokenRefreshFailed', 'Count', 1);

    return jsonResponse(401, {
      success: false,
      error: {
        code: 'REFRESH_FAILED',
        message: 'Invalid refresh token',
      },
    });
  }
}

// ============================================================================
// Handler: Get Profile
// ============================================================================

export async function handleGetProfile(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  try {
    const config = getEnvironmentConfig();
    const accessToken = event.headers['Authorization']?.replace('Bearer ', '');

    if (!accessToken) {
      return jsonResponse(401, {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing access token' },
      });
    }

    // Get user from Cognito
    const cognitoUser = await cognito.getUser(accessToken, config);

    // Get user from database
    const dbUser = await db.getUserByCognitoSub(cognitoUser.sub);

    metrics.addMetric('GetProfileSuccess', 'Count', 1);

    return jsonResponse(200, {
      success: true,
      data: {
        user: {
          userId: cognitoUser.sub,
          email: cognitoUser.email,
          fullName: dbUser?.full_name || cognitoUser.name,
          phone: dbUser?.phone || cognitoUser.phone,
          preferredLanguage: dbUser?.preferred_language || 'en',
          createdAt: dbUser?.created_at.toISOString() || new Date().toISOString(),
          updatedAt: dbUser?.updated_at.toISOString() || new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Get profile failed', { error: error instanceof Error ? error.message : 'Unknown error' });

    return jsonResponse(401, {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid access token' },
    });
  }
}

// ============================================================================
// Handler: Update Profile
// ============================================================================

export async function handleUpdateProfile(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  try {
    const config = getEnvironmentConfig();
    const accessToken = event.headers['Authorization']?.replace('Bearer ', '');

    if (!accessToken) {
      return jsonResponse(401, {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing access token' },
      });
    }

    const body = parseBody(event);
    const request = UpdateProfileRequestSchema.parse(body);

    // Get user from Cognito
    const cognitoUser = await cognito.getUser(accessToken, config);

    // Update Cognito attributes
    if (request.fullName || request.phone) {
      await cognito.updateUserAttributes(
        accessToken,
        { name: request.fullName, phone: request.phone },
        config
      );
    }

    // Update database
    const updatedUser = await db.updateUser(cognitoUser.sub, {
      fullName: request.fullName,
      phone: request.phone,
      preferredLanguage: request.preferredLanguage,
    });

    metrics.addMetric('UpdateProfileSuccess', 'Count', 1);

    return jsonResponse(200, {
      success: true,
      data: {
        user: {
          userId: cognitoUser.sub,
          email: cognitoUser.email,
          fullName: updatedUser.full_name || undefined,
          phone: updatedUser.phone || undefined,
          preferredLanguage: updatedUser.preferred_language,
          updatedAt: updatedUser.updated_at.toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Update profile failed', { error: error instanceof Error ? error.message : 'Unknown error' });

    return jsonResponse(400, {
      success: false,
      error: { code: 'UPDATE_FAILED', message: error instanceof Error ? error.message : 'Update failed' },
    });
  }
}

// ============================================================================
// Handler: Sign Out
// ============================================================================

export async function handleSignOut(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  try {
    const config = getEnvironmentConfig();
    const accessToken = event.headers['Authorization']?.replace('Bearer ', '');

    if (!accessToken) {
      return jsonResponse(401, {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing access token' },
      });
    }

    await cognito.signOut(accessToken, config);

    metrics.addMetric('SignOutSuccess', 'Count', 1);

    return jsonResponse(200, { success: true });
  } catch (error) {
    logger.error('Sign out failed', { error: error instanceof Error ? error.message : 'Unknown error' });

    return jsonResponse(400, {
      success: false,
      error: { code: 'SIGNOUT_FAILED', message: 'Sign out failed' },
    });
  }
}

// ============================================================================
// Handler: Forgot Password
// ============================================================================

export async function handleForgotPassword(event: APIGatewayEvent): Promise<APIGatewayResponse> {
  try {
    const config = getEnvironmentConfig();
    const body = parseBody(event);
    const email = (body as { email: string }).email;

    await cognito.forgotPassword(email, config);

    metrics.addMetric('ForgotPasswordSuccess', 'Count', 1);

    return jsonResponse(200, {
      success: true,
      data: { message: 'Password reset email sent' },
    });
  } catch (error) {
    logger.error('Forgot password failed', { error: error instanceof Error ? error.message : 'Unknown error' });

    return jsonResponse(400, {
      success: false,
      error: { code: 'FORGOT_PASSWORD_FAILED', message: 'Failed to initiate password reset' },
    });
  }
}
