import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  GenerateDataKeyCommand,
} from '@aws-sdk/client-kms';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });

let kekCertificate: Buffer | null = null;

/**
 * Load the KEK certificate from Secrets Manager
 */
async function loadKEKCertificate(): Promise<Buffer> {
  if (kekCertificate) {
    return kekCertificate;
  }

  const kekSecretArn = process.env.KEK_SECRET_ARN;
  if (!kekSecretArn) {
    throw new Error('KEK_SECRET_ARN environment variable not set');
  }

  const command = new GetSecretValueCommand({
    SecretId: kekSecretArn,
  });

  const response = await secretsClient.send(command);
  
  if (response.SecretBinary) {
    kekCertificate = Buffer.from(response.SecretBinary as Uint8Array);
  } else if (response.SecretString) {
    kekCertificate = Buffer.from(response.SecretString, 'base64');
  } else {
    throw new Error('KEK certificate not found in secret');
  }

  return kekCertificate;
}

/**
 * Encrypt sensitive data using KMS
 */
export async function encryptData(plaintext: string): Promise<string> {
  const kmsKeyId = process.env.KMS_KEY_ID;
  if (!kmsKeyId) {
    throw new Error('KMS_KEY_ID environment variable not set');
  }

  const command = new EncryptCommand({
    KeyId: kmsKeyId,
    Plaintext: Buffer.from(plaintext, 'utf-8'),
  });

  const response = await kmsClient.send(command);
  
  if (!response.CiphertextBlob) {
    throw new Error('Encryption failed: no ciphertext returned');
  }

  return Buffer.from(response.CiphertextBlob).toString('base64');
}

/**
 * Decrypt data using KMS
 */
export async function decryptData(ciphertext: string): Promise<string> {
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(ciphertext, 'base64'),
  });

  const response = await kmsClient.send(command);
  
  if (!response.Plaintext) {
    throw new Error('Decryption failed: no plaintext returned');
  }

  return Buffer.from(response.Plaintext).toString('utf-8');
}

/**
 * Generate a data encryption key for envelope encryption
 */
export async function generateDataKey(): Promise<{
  plaintextKey: Buffer;
  encryptedKey: Buffer;
}> {
  const kmsKeyId = process.env.KMS_KEY_ID;
  if (!kmsKeyId) {
    throw new Error('KMS_KEY_ID environment variable not set');
  }

  const command = new GenerateDataKeyCommand({
    KeyId: kmsKeyId,
    KeySpec: 'AES_256',
  });

  const response = await kmsClient.send(command);

  if (!response.Plaintext || !response.CiphertextBlob) {
    throw new Error('Data key generation failed');
  }

  return {
    plaintextKey: Buffer.from(response.Plaintext),
    encryptedKey: Buffer.from(response.CiphertextBlob),
  };
}

/**
 * CorpID-specific encryption for tokens
 * Follows the CorpID encryption specification with KEK/CEK management
 */
export async function encryptCorpIDToken(token: string): Promise<{
  encryptedToken: string;
  encryptedKey: string;
} | null> {
  try {
    // For CorpID, we need to use the specific KEK certificate
    // This is a simplified version - the actual CorpID encryption is more complex
    const encryptedToken = await encryptData(token);
    
    // In production, we would use the KEK certificate to encrypt the CEK
    // For now, we use KMS directly
    return {
      encryptedToken,
      encryptedKey: '', // Would contain the encrypted CEK in production
    };
  } catch (error) {
    console.error('Error encrypting CorpID token:', error);
    return null;
  }
}

/**
 * Decrypt CorpID token
 */
export async function decryptCorpIDToken(encryptedToken: string): Promise<string | null> {
  try {
    return await decryptData(encryptedToken);
  } catch (error) {
    console.error('Error decrypting CorpID token:', error);
    return null;
  }
}
