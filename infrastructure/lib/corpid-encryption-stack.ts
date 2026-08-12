import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

/**
 * CorpID Encryption Stack
 * 
 * Manages KEK (Key Encryption Key) and CEK (Content Encryption Key) for CorpID API integration.
 * 
 * CorpID uses a two-layer encryption system:
 * 1. KEK (Key Encryption Key) - RSA key pair for encrypting the CEK
 * 2. CEK (Content Encryption Key) - AES-256-GCM key for encrypting API payloads
 * 
 * Flow:
 * 1. Upload your KEK public key certificate to CorpID
 * 2. CorpID generates a CEK and encrypts it with your KEK public key
 * 3. Call Get CEK API to receive the encrypted CEK
 * 4. Decrypt CEK using your KEK private key (stored in Secrets Manager)
 * 5. Use CEK to encrypt/decrypt all API request/response bodies
 */
export class CorpIDEncryptionStack extends cdk.NestedStack {
  /**
   * Secret containing the KEK private key
   * This must be manually populated with the .p12 file contents
   */
  public readonly kekPrivateKeySecret: secretsmanager.Secret;
  
  /**
   * Secret for caching CEK (Content Encryption Key)
   * The CEK will be stored here after retrieval from CorpID API
   */
  public readonly cekCacheSecret: secretsmanager.Secret;
  
  /**
   * KMS key for encrypting the CEK cache
   */
  public readonly cekEncryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // ========================================================================
    // KMS Key for CEK Cache Encryption
    // ========================================================================
    
    this.cekEncryptionKey = new kms.Key(this, 'CEKEncryptionKey', {
      description: 'KMS key for encrypting CorpID CEK cache',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================================================
    // KEK Private Key Secret
    // ========================================================================
    
    this.kekPrivateKeySecret = new secretsmanager.Secret(this, 'KEKPrivateKey', {
      description: 'CorpID KEK private key for decrypting CEK',
      secretName: 'quickcorpid/corpid/kek-private-key',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================================================
    // CEK Cache Secret
    // ========================================================================
    
    this.cekCacheSecret = new secretsmanager.Secret(this, 'CEKCache', {
      description: 'Cached CorpID Content Encryption Key (CEK)',
      secretName: 'quickcorpid/corpid/cek-cache',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryptionKey: this.cekEncryptionKey,
    });

    // ========================================================================
    // Instructions Secret
    // ========================================================================
    
    // Instructions will be stored in the README and documentation
    // Sandbox KEK PIN: 8568185550716550

    // ========================================================================
    // Outputs
    // ========================================================================
    
    new cdk.CfnOutput(this, 'KEKPrivateKeySecretArn', {
      value: this.kekPrivateKeySecret.secretArn,
      description: 'ARN of the secret containing KEK private key',
    });

    new cdk.CfnOutput(this, 'CEKCacheSecretArn', {
      value: this.cekCacheSecret.secretArn,
      description: 'ARN of the secret for caching CEK',
    });
  }
}
