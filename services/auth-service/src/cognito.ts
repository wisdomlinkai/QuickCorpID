/**
 * QuickCorpID Auth Service - Cognito Client
 * 
 * Handles all Cognito Identity Provider operations
 */

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  GlobalSignOutCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AuthFlowType,
  ChallengeNameType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { EnvironmentConfig } from './types';

// ============================================================================
// Cognito Client
// ============================================================================

let client: CognitoIdentityProviderClient | null = null;

export function getCognitoClient(config: EnvironmentConfig): CognitoIdentityProviderClient {
  if (!client) {
    client = new CognitoIdentityProviderClient({
      region: config.REGION,
    });
  }
  return client;
}

// ============================================================================
// Sign Up
// ============================================================================

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  config: EnvironmentConfig,
  phone?: string
): Promise<{ userSub: string; confirmed: boolean }> {
  const client = getCognitoClient(config);

  const command = new SignUpCommand({
    ClientId: config.USER_POOL_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: fullName },
      ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
    ],
  });

  const response = await client.send(command);

  return {
    userSub: response.UserSub || '',
    confirmed: response.UserConfirmed || false,
  };
}

// ============================================================================
// Sign In (USER_PASSWORD_AUTH)
// ============================================================================

export async function signIn(
  email: string,
  password: string,
  config: EnvironmentConfig
): Promise<{
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  challengeName?: string;
  challengeParameters?: Record<string, string>;
}> {
  const client = getCognitoClient(config);

  const command = new InitiateAuthCommand({
    ClientId: config.USER_POOL_CLIENT_ID,
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      ...(config.USER_POOL_CLIENT_SECRET ? { SECRET_HASH: config.USER_POOL_CLIENT_SECRET } : {}),
    },
  });

  const response = await client.send(command);

  // Handle NEW_PASSWORD_REQUIRED challenge
  if (response.ChallengeName === ChallengeNameType.NEW_PASSWORD_REQUIRED) {
    return {
      accessToken: '',
      idToken: '',
      refreshToken: '',
      expiresIn: 0,
      challengeName: response.ChallengeName,
      challengeParameters: response.ChallengeParameters,
    };
  }

  return {
    accessToken: response.AuthenticationResult?.AccessToken || '',
    idToken: response.AuthenticationResult?.IdToken || '',
    refreshToken: response.AuthenticationResult?.RefreshToken || '',
    expiresIn: response.AuthenticationResult?.ExpiresIn || 3600,
  };
}

// ============================================================================
// Refresh Token
// ============================================================================

export async function refreshTokens(
  refreshToken: string,
  config: EnvironmentConfig
): Promise<{ accessToken: string; idToken: string; expiresIn: number }> {
  const client = getCognitoClient(config);

  const command = new InitiateAuthCommand({
    ClientId: config.USER_POOL_CLIENT_ID,
    AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
      ...(config.USER_POOL_CLIENT_SECRET ? { SECRET_HASH: config.USER_POOL_CLIENT_SECRET } : {}),
    },
  });

  const response = await client.send(command);

  return {
    accessToken: response.AuthenticationResult?.AccessToken || '',
    idToken: response.AuthenticationResult?.IdToken || '',
    expiresIn: response.AuthenticationResult?.ExpiresIn || 3600,
  };
}

// ============================================================================
// Get User
// ============================================================================

export async function getUser(accessToken: string, config: EnvironmentConfig): Promise<{
  sub: string;
  email: string;
  name?: string;
  phone?: string;
}> {
  const client = getCognitoClient(config);

  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const response = await client.send(command);

  const attributes = response.UserAttributes || [];
  const getAttribute = (name: string) => attributes.find(a => a.Name === name)?.Value;

  return {
    sub: getAttribute('sub') || '',
    email: getAttribute('email') || '',
    name: getAttribute('name'),
    phone: getAttribute('phone_number'),
  };
}

// ============================================================================
// Update User Attributes
// ============================================================================

export async function updateUserAttributes(
  accessToken: string,
  attributes: { name?: string; phone?: string },
  config: EnvironmentConfig
): Promise<void> {
  const client = getCognitoClient(config);

  const userAttributes = [
    ...(attributes.name ? [{ Name: 'name', Value: attributes.name }] : []),
    ...(attributes.phone ? [{ Name: 'phone_number', Value: attributes.phone }] : []),
  ];

  if (userAttributes.length === 0) return;

  const command = new UpdateUserAttributesCommand({
    AccessToken: accessToken,
    UserAttributes: userAttributes,
  });

  await client.send(command);
}

// ============================================================================
// Forgot Password
// ============================================================================

export async function forgotPassword(email: string, config: EnvironmentConfig): Promise<void> {
  const client = getCognitoClient(config);

  const command = new ForgotPasswordCommand({
    ClientId: config.USER_POOL_CLIENT_ID,
    Username: email,
    SecretHash: config.USER_POOL_CLIENT_SECRET,
  });

  await client.send(command);
}

export async function confirmForgotPassword(
  email: string,
  confirmationCode: string,
  newPassword: string,
  config: EnvironmentConfig
): Promise<void> {
  const client = getCognitoClient(config);

  const command = new ConfirmForgotPasswordCommand({
    ClientId: config.USER_POOL_CLIENT_ID,
    Username: email,
    ConfirmationCode: confirmationCode,
    Password: newPassword,
    SecretHash: config.USER_POOL_CLIENT_SECRET,
  });

  await client.send(command);
}

// ============================================================================
// Sign Out
// ============================================================================

export async function signOut(accessToken: string, config: EnvironmentConfig): Promise<void> {
  const client = getCognitoClient(config);

  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });

  await client.send(command);
}

// ============================================================================
// Respond to Challenge (e.g., NEW_PASSWORD_REQUIRED)
// ============================================================================

export async function respondToAuthChallenge(
  session: string,
  challengeName: string,
  email: string,
  newPassword: string,
  config: EnvironmentConfig
): Promise<{
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const client = getCognitoClient(config);

  const command = new RespondToAuthChallengeCommand({
    ClientId: config.USER_POOL_CLIENT_ID,
    ChallengeName: challengeName as ChallengeNameType,
    Session: session,
    ChallengeResponses: {
      USERNAME: email,
      NEW_PASSWORD: newPassword,
      ...(config.USER_POOL_CLIENT_SECRET ? { SECRET_HASH: config.USER_POOL_CLIENT_SECRET } : {}),
    },
  });

  const response = await client.send(command);

  return {
    accessToken: response.AuthenticationResult?.AccessToken || '',
    idToken: response.AuthenticationResult?.IdToken || '',
    refreshToken: response.AuthenticationResult?.RefreshToken || '',
    expiresIn: response.AuthenticationResult?.ExpiresIn || 3600,
  };
}
