"use strict";
/**
 * QuickCorpID Auth Service - Lambda Handlers
 *
 * API Gateway Lambda handlers for authentication endpoints
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSignUp = handleSignUp;
exports.handleSignIn = handleSignIn;
exports.handleRefreshToken = handleRefreshToken;
exports.handleGetProfile = handleGetProfile;
exports.handleUpdateProfile = handleUpdateProfile;
exports.handleSignOut = handleSignOut;
exports.handleForgotPassword = handleForgotPassword;
const logger_1 = require("@aws-lambda-powertools/logger");
const metrics_1 = require("@aws-lambda-powertools/metrics");
const tracer_1 = require("@aws-lambda-powertools/tracer");
const types_1 = require("./types");
const cognito = __importStar(require("./cognito"));
const db = __importStar(require("./database"));
// ============================================================================
// PowerTools Setup
// ============================================================================
const logger = new logger_1.Logger({ serviceName: 'auth-service' });
const metrics = new metrics_1.Metrics({ namespace: 'QuickCorpID/Auth' });
const tracer = new tracer_1.Tracer({ serviceName: 'auth-service' });
// ============================================================================
// Helper Functions
// ============================================================================
function jsonResponse(statusCode, body) {
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
function parseBody(event) {
    if (!event.body) {
        throw new Error('Request body is required');
    }
    return JSON.parse(event.body);
}
// ============================================================================
// Handler: Sign Up
// ============================================================================
async function handleSignUp(event) {
    try {
        const config = (0, types_1.getEnvironmentConfig)();
        const body = parseBody(event);
        const request = types_1.SignUpRequestSchema.parse(body);
        logger.info('Sign up request', { email: request.email });
        // Create Cognito user
        const result = await cognito.signUp(request.email, request.password, request.fullName, config, request.phone);
        // Create database record
        await db.createUser(result.userSub, request.email, request.fullName, request.phone, request.preferredLanguage);
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
    }
    catch (error) {
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
async function handleSignIn(event) {
    try {
        const config = (0, types_1.getEnvironmentConfig)();
        const body = parseBody(event);
        const request = types_1.SignInRequestSchema.parse(body);
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
    }
    catch (error) {
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
async function handleRefreshToken(event) {
    try {
        const config = (0, types_1.getEnvironmentConfig)();
        const body = parseBody(event);
        const request = types_1.RefreshTokenRequestSchema.parse(body);
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
    }
    catch (error) {
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
async function handleGetProfile(event) {
    try {
        const config = (0, types_1.getEnvironmentConfig)();
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
    }
    catch (error) {
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
async function handleUpdateProfile(event) {
    try {
        const config = (0, types_1.getEnvironmentConfig)();
        const accessToken = event.headers['Authorization']?.replace('Bearer ', '');
        if (!accessToken) {
            return jsonResponse(401, {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Missing access token' },
            });
        }
        const body = parseBody(event);
        const request = types_1.UpdateProfileRequestSchema.parse(body);
        // Get user from Cognito
        const cognitoUser = await cognito.getUser(accessToken, config);
        // Update Cognito attributes
        if (request.fullName || request.phone) {
            await cognito.updateUserAttributes(accessToken, { name: request.fullName, phone: request.phone }, config);
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
    }
    catch (error) {
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
async function handleSignOut(event) {
    try {
        const config = (0, types_1.getEnvironmentConfig)();
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
    }
    catch (error) {
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
async function handleForgotPassword(event) {
    try {
        const config = (0, types_1.getEnvironmentConfig)();
        const body = parseBody(event);
        const email = body.email;
        await cognito.forgotPassword(email, config);
        metrics.addMetric('ForgotPasswordSuccess', 'Count', 1);
        return jsonResponse(200, {
            success: true,
            data: { message: 'Password reset email sent' },
        });
    }
    catch (error) {
        logger.error('Forgot password failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        return jsonResponse(400, {
            success: false,
            error: { code: 'FORGOT_PASSWORD_FAILED', message: 'Failed to initiate password reset' },
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaGFuZGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0RILG9DQWtEQztBQU1ELG9DQStDQztBQU1ELGdEQWlDQztBQU1ELDRDQTBDQztBQU1ELGtEQXlEQztBQU1ELHNDQXlCQztBQU1ELG9EQXNCQztBQTFXRCwwREFBdUQ7QUFDdkQsNERBQXlEO0FBQ3pELDBEQUF1RDtBQUV2RCxtQ0FNaUI7QUFDakIsbURBQXFDO0FBQ3JDLCtDQUFpQztBQUVqQywrRUFBK0U7QUFDL0UsbUJBQW1CO0FBQ25CLCtFQUErRTtBQUUvRSxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0FBQzNELE1BQU0sT0FBTyxHQUFHLElBQUksaUJBQU8sQ0FBQyxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUM7QUFDL0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztBQUUzRCwrRUFBK0U7QUFDL0UsbUJBQW1CO0FBQ25CLCtFQUErRTtBQUUvRSxTQUFTLFlBQVksQ0FBQyxVQUFrQixFQUFFLElBQWE7SUFDckQsT0FBTztRQUNMLFVBQVU7UUFDVixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsa0JBQWtCO1lBQ2xDLDZCQUE2QixFQUFFLEdBQUc7WUFDbEMsOEJBQThCLEVBQUUsNEJBQTRCO1lBQzVELDhCQUE4QixFQUFFLDZCQUE2QjtTQUM5RDtRQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztLQUMzQixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFJLEtBQXNCO0lBQzFDLElBQUksQ0FBQyxLQUFLLENB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TUFBTSxPQUFPLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUU1QyxPQUFPLENBQUMsU0FBUyxDQUFDLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV2RCxPQUFPLFlBQVksQ0FBQyxHQUFHLEVBQUU7WUFDdkIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsMkJBQTJCLEVBQUU7U0FDL0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFFNUcsT0FBTyxZQUFZLENBQUMsR0FBRyxFQUFFO1lBQ3ZCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLHdCQUF3QixFQUFFLE9BQU8sRUFBRSxtQ0FBbUMsRUFBRTtTQUN4RixDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUXVpY2tDb3JwSUQgQXV0aCBTZXJ2aWNlIC0gTGFtYmRhIEhhbmRsZXJzXG4gKiBcbiAqIEFQSSBHYXRld2F5IExhbWJkYSBoYW5kbGVycyBmb3IgYXV0aGVudGljYXRpb24gZW5kcG9pbnRzXG4gKi9cblxuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnQGF3cy1sYW1iZGEtcG93ZXJ0b29scy9sb2dnZXInO1xuaW1wb3J0IHsgTWV0cmljcyB9IGZyb20gJ0Bhd3MtbGFtYmRhLXBvd2VydG9vbHMvbWV0cmljcyc7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tICdAYXdzLWxhbWJkYS1wb3dlcnRvb2xzL3RyYWNlcic7XG5pbXBvcnQgdHlwZSB7IEFQSUdhdGV3YXlFdmVudCwgQVBJR2F0ZXdheVJlc3BvbnNlIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge1xuICBTaWduVXBSZXF1ZXN0U2NoZW1hLFxuICBTaWduSW5SZXF1ZXN0U2NoZW1hLFxuICBSZWZyZXNoVG9rZW5SZXF1ZXN0U2NoZW1hLFxuICBVcGRhdGVQcm9maWxlUmVxdWVzdFNjaGVtYSxcbiAgZ2V0RW52aXJvbm1lbnRDb25maWcsXG59IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICcuL2NvZ25pdG8nO1xuaW1wb3J0ICogYXMgZGIgZnJvbSAnLi9kYXRhYmFzZSc7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFBvd2VyVG9vbHMgU2V0dXBcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcih7IHNlcnZpY2VOYW1lOiAnYXV0aC1zZXJ2aWNlJyB9KTtcbmNvbnN0IG1ldHJpY3MgPSBuZXcgTWV0cmljcyh7IG5hbWVzcGFjZTogJ1F1aWNrQ29ycElEL0F1dGgnIH0pO1xuY29uc3QgdHJhY2VyID0gbmV3IFRyYWNlcih7IHNlcnZpY2VOYW1lOiAnYXV0aC1zZXJ2aWNlJyB9KTtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gSGVscGVyIEZ1bmN0aW9uc1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBqc29uUmVzcG9uc2Uoc3RhdHVzQ29kZTogbnVtYmVyLCBib2R5OiB1bmtub3duKTogQVBJR2F0ZXdheVJlc3BvbnNlIHtcbiAgcmV0dXJuIHtcbiAgICBzdGF0dXNDb2RlLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnQ29udGVudC1UeXBlLEF1dGhvcml6YXRpb24nLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULFBPU1QsUFVULERFTEVURSxPUFRJT05TJyxcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBwYXJzZUJvZHk8VD4oZXZlbnQ6IEFQSUdhdGV3YXlFdmVudCk6IFQge1xuICBpZiAoIWV2ZW50LmJvZHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlcXVlc3QgYm9keSBpcyByZXF1aXJlZCcpO1xuICB9XG4gIHJldHVybiBKU09OLnBhcnNlKGV2ZW50LmJvZHkpIGFzIFQ7XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEhhbmRsZXI6IFNpZ24gVXBcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVNpZ25VcChldmVudDogQVBJR2F0ZXdheUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UmVzcG9uc2U+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWcgPSBnZXRFbnZpcm9ubWVudENvbmZpZygpO1xuICAgIGNvbnN0IGJvZHkgPSBwYXJzZUJvZHkoZXZlbnQpO1xuICAgIGNvbnN0IHJlcXVlc3QgPSBTaWduVXBSZXF1ZXN0U2NoZW1hLnBhcnNlKGJvZHkpO1xuXG4gICAgbG9nZ2VyLmluZm8oJ1NpZ24gdXAgcmVxdWVzdCcsIHsgZW1haWw6IHJlcXVlc3QuZW1haWwgfSk7XG5cbiAgICAvLyBDcmVhdGUgQ29nbml0byB1c2VyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY29nbml0by5zaWduVXAoXG4gICAgICByZXF1ZXN0LmVtYWlsLFxuICAgICAgcmVxdWVzdC5wYXNzd29yZCxcbiAgICAgIHJlcXVlc3QuZnVsbE5hbWUsXG4gICAgICBjb25maWcsXG4gICAgICByZXF1ZXN0LnBob25lXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBkYXRhYmFzZSByZWNvcmRcbiAgICBhd2FpdCBkYi5jcmVhdGVVc2VyKFxuICAgICAgcmVzdWx0LnVzZXJTdWIsXG4gICAgICByZXF1ZXN0LmVtYWlsLFxuICAgICAgcmVxdWVzdC5mdWxsTmFtZSxcbiAgICAgIHJlcXVlc3QucGhvbmUsXG4gICAgICByZXF1ZXN0LnByZWZlcnJlZExhbmd1YWdlXG4gICAgKTtcblxuICAgIG1ldHJpY3MuYWRkTWV0cmljKCdTaWduVXBTdWNjZXNzJywgJ0NvdW50JywgMSk7XG5cbiAgICByZXR1cm4ganNvblJlc3BvbnNlKDIwMSwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgdXNlcjoge1xuICAgICAgICAgIHVzZXJJZDogcmVzdWx0LnVzZXJTdWIsXG4gICAgICAgICAgZW1haWw6IHJlcXVlc3QuZW1haWwsXG4gICAgICAgICAgY29uZmlybWVkOiByZXN1bHQuY29uZmlybWVkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1NpZ24gdXAgZmFpbGVkJywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgbWV0cmljcy5hZGRNZXRyaWMoJ1NpZ25VcEZhaWxlZCcsICdDb3VudCcsIDEpO1xuXG4gICAgcmV0dXJuIGpzb25SZXNwb25zZSg0MDAsIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IHtcbiAgICAgICAgY29kZTogJ1NJR05VUF9GQUlMRUQnLFxuICAgICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdTaWduIHVwIGZhaWxlZCcsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEhhbmRsZXI6IFNpZ24gSW5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVNpZ25JbihldmVudDogQVBJR2F0ZXdheUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UmVzcG9uc2U+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWcgPSBnZXRFbnZpcm9ubWVudENvbmZpZygpO1xuICAgIGNvbnN0IGJvZHkgPSBwYXJzZUJvZHkoZXZlbnQpO1xuICAgIGNvbnN0IHJlcXVlc3QgPSBTaWduSW5SZXF1ZXN0U2NoZW1hLnBhcnNlKGJvZHkpO1xuXG4gICAgbG9nZ2VyLmluZm8oJ1NpZ24gaW4gcmVxdWVzdCcsIHsgZW1haWw6IHJlcXVlc3QuZW1haWwgfSk7XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjb2duaXRvLnNpZ25JbihyZXF1ZXN0LmVtYWlsLCByZXF1ZXN0LnBhc3N3b3JkLCBjb25maWcpO1xuXG4gICAgLy8gSGFuZGxlIE5FV19QQVNTV09SRF9SRVFVSVJFRCBjaGFsbGVuZ2VcbiAgICBpZiAocmVzdWx0LmNoYWxsZW5nZU5hbWUpIHtcbiAgICAgIHJldHVybiBqc29uUmVzcG9uc2UoMjAwLCB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgY2hhbGxlbmdlTmFtZTogcmVzdWx0LmNoYWxsZW5nZU5hbWUsXG4gICAgICAgICAgY2hhbGxlbmdlUGFyYW1ldGVyczogcmVzdWx0LmNoYWxsZW5nZVBhcmFtZXRlcnMsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBtZXRyaWNzLmFkZE1ldHJpYygnU2lnbkluU3VjY2VzcycsICdDb3VudCcsIDEpO1xuXG4gICAgcmV0dXJuIGpzb25SZXNwb25zZSgyMDAsIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHRva2Vuczoge1xuICAgICAgICAgIGFjY2Vzc1Rva2VuOiByZXN1bHQuYWNjZXNzVG9rZW4sXG4gICAgICAgICAgaWRUb2tlbjogcmVzdWx0LmlkVG9rZW4sXG4gICAgICAgICAgcmVmcmVzaFRva2VuOiByZXN1bHQucmVmcmVzaFRva2VuLFxuICAgICAgICAgIGV4cGlyZXNJbjogcmVzdWx0LmV4cGlyZXNJbixcbiAgICAgICAgICB0b2tlblR5cGU6ICdCZWFyZXInLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1NpZ24gaW4gZmFpbGVkJywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgbWV0cmljcy5hZGRNZXRyaWMoJ1NpZ25JbkZhaWxlZCcsICdDb3VudCcsIDEpO1xuXG4gICAgcmV0dXJuIGpzb25SZXNwb25zZSg0MDEsIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IHtcbiAgICAgICAgY29kZTogJ1NJR05JTl9GQUlMRUQnLFxuICAgICAgICBtZXNzYWdlOiAnSW52YWxpZCBlbWFpbCBvciBwYXNzd29yZCcsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEhhbmRsZXI6IFJlZnJlc2ggVG9rZW5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVJlZnJlc2hUb2tlbihldmVudDogQVBJR2F0ZXdheUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UmVzcG9uc2U+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWcgPSBnZXRFbnZpcm9ubWVudENvbmZpZygpO1xuICAgIGNvbnN0IGJvZHkgPSBwYXJzZUJvZHkoZXZlbnQpO1xuICAgIGNvbnN0IHJlcXVlc3QgPSBSZWZyZXNoVG9rZW5SZXF1ZXN0U2NoZW1hLnBhcnNlKGJvZHkpO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY29nbml0by5yZWZyZXNoVG9rZW5zKHJlcXVlc3QucmVmcmVzaFRva2VuLCBjb25maWcpO1xuXG4gICAgbWV0cmljcy5hZGRNZXRyaWMoJ1Rva2VuUmVmcmVzaFN1Y2Nlc3MnLCAnQ291bnQnLCAxKTtcblxuICAgIHJldHVybiBqc29uUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICB0b2tlbnM6IHtcbiAgICAgICAgICBhY2Nlc3NUb2tlbjogcmVzdWx0LmFjY2Vzc1Rva2VuLFxuICAgICAgICAgIGlkVG9rZW46IHJlc3VsdC5pZFRva2VuLFxuICAgICAgICAgIGV4cGlyZXNJbjogcmVzdWx0LmV4cGlyZXNJbixcbiAgICAgICAgICB0b2tlblR5cGU6ICdCZWFyZXInLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1Rva2VuIHJlZnJlc2ggZmFpbGVkJywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG4gICAgbWV0cmljcy5hZGRNZXRyaWMoJ1Rva2VuUmVmcmVzaEZhaWxlZCcsICdDb3VudCcsIDEpO1xuXG4gICAgcmV0dXJuIGpzb25SZXNwb25zZSg0MDEsIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IHtcbiAgICAgICAgY29kZTogJ1JFRlJFU0hfRkFJTEVEJyxcbiAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgcmVmcmVzaCB0b2tlbicsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEhhbmRsZXI6IEdldCBQcm9maWxlXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVHZXRQcm9maWxlKGV2ZW50OiBBUElHYXRld2F5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlSZXNwb25zZT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbmZpZyA9IGdldEVudmlyb25tZW50Q29uZmlnKCk7XG4gICAgY29uc3QgYWNjZXNzVG9rZW4gPSBldmVudC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10/LnJlcGxhY2UoJ0JlYXJlciAnLCAnJyk7XG5cbiAgICBpZiAoIWFjY2Vzc1Rva2VuKSB7XG4gICAgICByZXR1cm4ganNvblJlc3BvbnNlKDQwMSwge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IHsgY29kZTogJ1VOQVVUSE9SSVpFRCcsIG1lc3NhZ2U6ICdNaXNzaW5nIGFjY2VzcyB0b2tlbicgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEdldCB1c2VyIGZyb20gQ29nbml0b1xuICAgIGNvbnN0IGNvZ25pdG9Vc2VyID0gYXdhaXQgY29nbml0by5nZXRVc2VyKGFjY2Vzc1Rva2VuLCBjb25maWcpO1xuXG4gICAgLy8gR2V0IHVzZXIgZnJvbSBkYXRhYmFzZVxuICAgIGNvbnN0IGRiVXNlciA9IGF3YWl0IGRiLmdldFVzZXJCeUNvZ25pdG9TdWIoY29nbml0b1VzZXIuc3ViKTtcblxuICAgIG1ldHJpY3MuYWRkTWV0cmljKCdHZXRQcm9maWxlU3VjY2VzcycsICdDb3VudCcsIDEpO1xuXG4gICAgcmV0dXJuIGpzb25SZXNwb25zZSgyMDAsIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHVzZXI6IHtcbiAgICAgICAgICB1c2VySWQ6IGNvZ25pdG9Vc2VyLnN1YixcbiAgICAgICAgICBlbWFpbDogY29nbml0b1VzZXIuZW1haWwsXG4gICAgICAgICAgZnVsbE5hbWU6IGRiVXNlcj8uZnVsbF9uYW1lIHx8IGNvZ25pdG9Vc2VyLm5hbWUsXG4gICAgICAgICAgcGhvbmU6IGRiVXNlcj8ucGhvbmUgfHwgY29nbml0b1VzZXIucGhvbmUsXG4gICAgICAgICAgcHJlZmVycmVkTGFuZ3VhZ2U6IGRiVXNlcj8ucHJlZmVycmVkX2xhbmd1YWdlIHx8ICdlbicsXG4gICAgICAgICAgY3JlYXRlZEF0OiBkYlVzZXI/LmNyZWF0ZWRfYXQudG9JU09TdHJpbmcoKSB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgdXBkYXRlZEF0OiBkYlVzZXI/LnVwZGF0ZWRfYXQudG9JU09TdHJpbmcoKSB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ2dlci5lcnJvcignR2V0IHByb2ZpbGUgZmFpbGVkJywgeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSk7XG5cbiAgICByZXR1cm4ganNvblJlc3BvbnNlKDQwMSwge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogeyBjb2RlOiAnVU5BVVRIT1JJWkVEJywgbWVzc2FnZTogJ0ludmFsaWQgYWNjZXNzIHRva2VuJyB9LFxuICAgIH0pO1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIEhhbmRsZXI6IFVwZGF0ZSBQcm9maWxlXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVVcGRhdGVQcm9maWxlKGV2ZW50OiBBUElHYXRld2F5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlSZXNwb25zZT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbmZpZyA9IGdldEVudmlyb25tZW50Q29uZmlnKCk7XG4gICAgY29uc3QgYWNjZXNzVG9rZW4gPSBldmVudC5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10/LnJlcGxhY2UoJ0JlYXJlciAnLCAnJyk7XG5cbiAgICBpZiAoIWFjY2Vzc1Rva2VuKSB7XG4gICAgICByZXR1cm4ganNvblJlc3BvbnNlKDQwMSwge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IHsgY29kZTogJ1VOQVVUSE9SSVpFRCcsIG1lc3NhZ2U6ICdNaXNzaW5nIGFjY2VzcyB0b2tlbicgfSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGJvZHkgPSBwYXJzZUJvZHkoZXZlbnQpO1xuICAgIGNvbnN0IHJlcXVlc3QgPSBVcGRhdGVQcm9maWxlUmVxdWVzdFNjaGVtYS5wYXJzZShib2R5KTtcblxuICAgIC8vIEdldCB1c2VyIGZyb20gQ29nbml0b1xuICAgIGNvbnN0IGNvZ25pdG9Vc2VyID0gYXdhaXQgY29nbml0by5nZXRVc2VyKGFjY2Vzc1Rva2VuLCBjb25maWcpO1xuXG4gICAgLy8gVXBkYXRlIENvZ25pdG8gYXR0cmlidXRlc1xuICAgIGlmIChyZXF1ZXN0LmZ1bGxOYW1lIHx8IHJlcXVlc3QucGhvbmUpIHtcbiAgICAgIGF3YWl0IGNvZ25pdG8udXBkYXRlVXNlckF0dHJpYnV0ZXMoXG4gICAgICAgIGFjY2Vzc1Rva2VuLFxuICAgICAgICB7IG5hbWU6IHJlcXVlc3QuZnVsbE5hbWUsIHBob25lOiByZXF1ZXN0LnBob25lIH0sXG4gICAgICAgIGNvbmZpZ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgZGF0YWJhc2VcbiAgICBjb25zdCB1cGRhdGVkVXNlciA9IGF3YWl0IGRiLnVwZGF0ZVVzZXIoY29nbml0b1VzZXIuc3ViLCB7XG4gICAgICBmdWxsTmFtZTogcmVxdWVzdC5mdWxsTmFtZSxcbiAgICAgIHBob25lOiByZXF1ZXN0LnBob25lLFxuICAgICAgcHJlZmVycmVkTGFuZ3VhZ2U6IHJlcXVlc3QucHJlZmVycmVkTGFuZ3VhZ2UsXG4gICAgfSk7XG5cbiAgICBtZXRyaWNzLmFkZE1ldHJpYygnVXBkYXRlUHJvZmlsZVN1Y2Nlc3MnLCAnQ291bnQnLCAxKTtcblxuICAgIHJldHVybiBqc29uUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgdXNlcklkOiBjb2duaXRvVXNlci5zdWIsXG4gICAgICAgICAgZW1haWw6IGNvZ25pdG9Vc2VyLmVtYWlsLFxuICAgICAgICAgIGZ1bGxOYW1lOiB1cGRhdGVkVXNlci5mdWxsX25hbWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICAgIHBob25lOiB1cGRhdGVkVXNlci5waG9uZSB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgcHJlZmVycmVkTGFuZ3VhZ2U6IHVwZGF0ZWRVc2VyLnByZWZlcnJlZF9sYW5ndWFnZSxcbiAgICAgICAgICB1cGRhdGVkQXQ6IHVwZGF0ZWRVc2VyLnVwZGF0ZWRfYXQudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdVcGRhdGUgcHJvZmlsZSBmYWlsZWQnLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcblxuICAgIHJldHVybiBqc29uUmVzcG9uc2UoNDAwLCB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiB7IGNvZGU6ICdVUERBVEVfRkFJTEVEJywgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVXBkYXRlIGZhaWxlZCcgfSxcbiAgICB9KTtcbiAgfVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBIYW5kbGVyOiBTaWduIE91dFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlU2lnbk91dChldmVudDogQVBJR2F0ZXdheUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UmVzcG9uc2U+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWcgPSBnZXRFbnZpcm9ubWVudENvbmZpZygpO1xuICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gZXZlbnQuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddPy5yZXBsYWNlKCdCZWFyZXIgJywgJycpO1xuXG4gICAgaWYgKCFhY2Nlc3NUb2tlbikge1xuICAgICAgcmV0dXJuIGpzb25SZXNwb25zZSg0MDEsIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiB7IGNvZGU6ICdVTkFVVEhPUklaRUQnLCBtZXNzYWdlOiAnTWlzc2luZyBhY2Nlc3MgdG9rZW4nIH0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBhd2FpdCBjb2duaXRvLnNpZ25PdXQoYWNjZXNzVG9rZW4sIGNvbmZpZyk7XG5cbiAgICBtZXRyaWNzLmFkZE1ldHJpYygnU2lnbk91dFN1Y2Nlc3MnLCAnQ291bnQnLCAxKTtcblxuICAgIHJldHVybiBqc29uUmVzcG9uc2UoMjAwLCB7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdTaWduIG91dCBmYWlsZWQnLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcblxuICAgIHJldHVybiBqc29uUmVzcG9uc2UoNDAwLCB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiB7IGNvZGU6ICdTSUdOT1VUX0ZBSUxFRCcsIG1lc3NhZ2U6ICdTaWduIG91dCBmYWlsZWQnIH0sXG4gICAgfSk7XG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gSGFuZGxlcjogRm9yZ290IFBhc3N3b3JkXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVGb3Jnb3RQYXNzd29yZChldmVudDogQVBJR2F0ZXdheUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UmVzcG9uc2U+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWcgPSBnZXRFbnZpcm9ubWVudENvbmZpZygpO1xuICAgIGNvbnN0IGJvZHkgPSBwYXJzZUJvZHkoZXZlbnQpO1xuICAgIGNvbnN0IGVtYWlsID0gKGJvZHkgYXMgeyBlbWFpbDogc3RyaW5nIH0pLmVtYWlsO1xuXG4gICAgYXdhaXQgY29nbml0by5mb3Jnb3RQYXNzd29yZChlbWFpbCwgY29uZmlnKTtcblxuICAgIG1ldHJpY3MuYWRkTWV0cmljKCdGb3Jnb3RQYXNzd29yZFN1Y2Nlc3MnLCAnQ291bnQnLCAxKTtcblxuICAgIHJldHVybiBqc29uUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogeyBtZXNzYWdlOiAnUGFzc3dvcmQgcmVzZXQgZW1haWwgc2VudCcgfSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ0ZvcmdvdCBwYXNzd29yZCBmYWlsZWQnLCB7IGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyB9KTtcblxuICAgIHJldHVybiBqc29uUmVzcG9uc2UoNDAwLCB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiB7IGNvZGU6ICdGT1JHT1RfUEFTU1dPUkRfRkFJTEVEJywgbWVzc2FnZTogJ0ZhaWxlZCB0byBpbml0aWF0ZSBwYXNzd29yZCByZXNldCcgfSxcbiAgICB9KTtcbiAgfVxufVxuIl19