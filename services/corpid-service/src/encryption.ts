import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';
import * as forge from 'node-forge';
import * as crypto from 'crypto';

/**
 * Content Encryption Key (CEK) structure
 */
export interface CEK {
  key: Buffer; // The actual AES-256 key
  encryptedKey: string; // Base64-encoded encrypted CEK from CorpID
  iv?: string; // Initialization vector for AES-GCM
  issuedAt: number; // Unix timestamp when CEK was issued
  expiresAt: number; // Unix timestamp when CEK expires
}

/**
 * CorpID encryption configuration
 */
export interface CorpIDEncryptionConfig {
  kekPrivateKeySecretArn: string; // ARN of the secret containing KEK private key
  cekCacheSecretArn: string; // ARN of the secret for caching CEK
  corpidApiBaseUrl: string; // CorpID API base URL (sandbox or production)
  kekPin?: string; // PIN for .p12 file (sandbox: 8568185550716550)
  cekTtlSeconds?: number; // CEK time-to-live in seconds (default: 3600)
}

/**
 * CorpID Encryption Manager
 * 
 * Handles the two-layer encryption system used by CorpID:
 * 1. KEK (Key Encryption Key) - RSA key pair for encrypting the CEK
 * 2. CEK (Content Encryption Key) - AES-256-GCM key for encrypting API payloads
 */
export class CorpIDEncryption {
  private secretsManager: SecretsManagerClient;
  private kms: KMSClient;
  private config: CorpIDEncryptionConfig;
  private cachedCEK: CEK | null = null;

  constructor(config: CorpIDEncryptionConfig) {
    this.secretsManager = new SecretsManagerClient({});
    this.kms = new KMSClient({});
    this.config = {
      ...config,
      cekTtlSeconds: config.cekTtlSeconds || 3600, // Default 1 hour
    };
  }

  /**
   * Get the Content Encryption Key (CEK)
   * 
   * This method:
   * 1. Checks if we have a valid cached CEK
   * 2. If not, retrieves a new CEK from CorpID API
   * 3. Decrypts the CEK using our KEK private key
   * 4. Caches the CEK for future use
   */
  async getCEK(): Promise<CEK> {
    // Check if we have a valid cached CEK
    if (this.cachedCEK && Date.now() < this.cachedCEK.expiresAt) {
      return this.cachedCEK;
    }

    // Try to load CEK from Secrets Manager cache
    try {
      const cachedCEK = await this.loadCEKFromCache();
      if (cachedCEK && Date.now() < cachedCEK.expiresAt) {
        this.cachedCEK = cachedCEK;
        return cachedCEK;
      }
    } catch (error) {
      console.log('No valid CEK in cache, fetching new one');
    }

    // Get new CEK from CorpID API
    const newCEK = await this.fetchCEKFromCorpID();
    
    // Cache the new CEK
    await this.saveCEKToCache(newCEK);
    this.cachedCEK = newCEK;

    return newCEK;
  }

  /**
   * Fetch a new CEK from CorpID API
   */
  private async fetchCEKFromCorpID(): Promise<CEK> {
    // TODO: Implement actual CorpID API call
    // This is a placeholder - the actual implementation will:
    // 1. Call CorpID's Get CEK API endpoint
    // 2. Receive the encrypted CEK
    // 3. Decrypt it using our KEK private key
    
    const response = await fetch(`${this.config.corpidApiBaseUrl}/api/v1/encryption/cek`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get CEK from CorpID: ${response.statusText}`);
    }

    const data = await response.json() as { encryptedCEK: string; expiresIn: number };
    
    // Decrypt the CEK using KEK private key
    const decryptedCEK = await this.decryptCEKWithKEK(data.encryptedCEK);

    return {
      key: decryptedCEK,
      encryptedKey: data.encryptedCEK,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (data.expiresIn * 1000),
    };
  }

  /**
   * Decrypt the CEK using KEK private key
   */
  private async decryptCEKWithKEK(encryptedCEK: string): Promise<Buffer> {
    // Get KEK private key from Secrets Manager
    const kekPrivateKey = await this.getKEKPrivateKey();

    // Decrypt using RSA-OAEP
    // Note: CorpID uses RSA for encryption
    const encryptedBuffer = Buffer.from(encryptedCEK, 'base64');
    
    const decryptedBuffer = crypto.privateDecrypt(
      {
        key: kekPrivateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedBuffer
    );

    return decryptedBuffer;
  }

  /**
   * Get the KEK private key from Secrets Manager
   */
  private async getKEKPrivateKey(): Promise<string> {
    const command = new GetSecretValueCommand({
      SecretId: this.config.kekPrivateKeySecretArn,
    });

    const response = await this.secretsManager.send(command);
    
    if (!response.SecretString) {
      throw new Error('KEK private key secret is empty');
    }

    // Parse the secret - it should contain the .p12 file content
    const secretData = JSON.parse(response.SecretString);
    
    // If it's a .p12 file, we need to extract the private key
    if (secretData.p12Content) {
      return this.extractPrivateKeyFromP12(
        secretData.p12Content,
        this.config.kekPin || ''
      );
    }

    // If it's already a PEM-formatted private key
    return secretData.privateKey;
  }

  /**
   * Extract private key from .p12 file
   */
  private extractPrivateKeyFromP12(p12Base64: string, pin: string): string {
    const p12Der = forge.util.decode64(p12Base64);
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, pin);

    // Extract private key
    const keyObj = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const privateKey = keyObj[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;

    if (!privateKey) {
      throw new Error('Failed to extract private key from .p12 file');
    }

    // Convert to PEM format
    return forge.pki.privateKeyToPem(privateKey);
  }

  /**
   * Encrypt content using CEK with AES-256-GCM
   */
  async encryptContent(data: unknown, cek: CEK): Promise<string> {
    // Generate random IV for AES-GCM
    const iv = crypto.randomBytes(12); // GCM recommends 12 bytes

    // Convert data to JSON string
    const plaintext = JSON.stringify(data);

    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', cek.key, iv, {
      authTagLength: 16,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted content, and auth tag
    // Format: base64(iv + authTag + encrypted)
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt content using CEK with AES-256-GCM
   */
  async decryptContent(encryptedContent: string, cek: CEK): Promise<unknown> {
    // Decode the combined buffer
    const combined = Buffer.from(encryptedContent, 'base64');

    // Extract IV (12 bytes), auth tag (16 bytes), and encrypted content
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);

    // Decrypt using AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', cek.key, iv, {
      authTagLength: 16,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    // Parse JSON
    return JSON.parse(decrypted);
  }

  /**
   * Load CEK from Secrets Manager cache
   */
  private async loadCEKFromCache(): Promise<CEK | null> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: this.config.cekCacheSecretArn,
      });

      const response = await this.secretsManager.send(command);
      
      if (!response.SecretString) {
        return null;
      }

      const cachedData = JSON.parse(response.SecretString);
      
      // Convert base64 key back to buffer
      return {
        key: Buffer.from(cachedData.key, 'base64'),
        encryptedKey: cachedData.encryptedKey,
        issuedAt: cachedData.issuedAt,
        expiresAt: cachedData.expiresAt,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Save CEK to Secrets Manager cache
   */
  private async saveCEKToCache(cek: CEK): Promise<void> {
    const command = new PutSecretValueCommand({
      SecretId: this.config.cekCacheSecretArn,
      SecretString: JSON.stringify({
        key: cek.key.toString('base64'),
        encryptedKey: cek.encryptedKey,
        issuedAt: cek.issuedAt,
        expiresAt: cek.expiresAt,
      }),
    });

    await this.secretsManager.send(command);
  }

  /**
   * Handle CEK rotation from CorpID callback
   * 
   * When CorpID rotates the CEK, it sends a callback with a new encrypted CEK.
   * This method handles that rotation.
   */
  async handleCEKRotation(newEncryptedCEK: string): Promise<void> {
    // Decrypt the new CEK
    const decryptedCEK = await this.decryptCEKWithKEK(newEncryptedCEK);

    // Create new CEK object
    const newCEK: CEK = {
      key: decryptedCEK,
      encryptedKey: newEncryptedCEK,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (this.config.cekTtlSeconds || 3600) * 1000,
    };

    // Save to cache
    await this.saveCEKToCache(newCEK);
    
    // Update in-memory cache
    this.cachedCEK = newCEK;
  }
}

export default CorpIDEncryption;
