# CorpID Service

TypeScript library for CorpID API integration with encryption support.

## Features

- ✅ KEK/CEK encryption management
- ✅ AES-256-GCM encryption/decryption
- ✅ CEK caching with TTL
- ✅ CEK rotation handling
- ✅ AWS Secrets Manager integration

## Installation

```bash
npm install @quickcorpid/corpid-service
```

## Usage

### Initialize the encryption manager

```typescript
import { CorpIDEncryption } from '@quickcorpid/corpid-service';

const encryption = new CorpIDEncryption({
  kekPrivateKeySecretArn: 'arn:aws:secretsmanager:ap-east-1:123456789:secret:quickcorpid/corpid/kek-private-key',
  cekCacheSecretArn: 'arn:aws:secretsmanager:ap-east-1:123456789:secret:quickcorpid/corpid/cek-cache',
  corpidApiBaseUrl: 'https://sb.corpid.gov.hk/api/v1', // Sandbox URL
  kekPin: '8568185550716550', // Sandbox KEK PIN
  cekTtlSeconds: 3600, // 1 hour TTL
});
```

### Get CEK

```typescript
const cek = await encryption.getCEK();
console.log('CEK expires at:', new Date(cek.expiresAt));
```

### Encrypt content

```typescript
const data = {
  br_number: '12345678',
  company_name: 'Sample Trading Limited',
};

const encrypted = await encryption.encryptContent(data, cek);
console.log('Encrypted:', encrypted);
```

### Decrypt content

```typescript
const decrypted = await encryption.decryptContent(encrypted, cek);
console.log('Decrypted:', decrypted);
```

### Handle CEK rotation

```typescript
// When CorpID sends a callback with a new CEK
await encryption.handleCEKRotation(newEncryptedCEK);
```

## CorpID Encryption Flow

1. **KEK Setup**:
   - Download KEK certificate (.p12) from CorpID Account Centre
   - Store the private key in AWS Secrets Manager
   - Upload the public key to CorpID

2. **CEK Retrieval**:
   - Call CorpID's Get CEK API
   - Receive encrypted CEK
   - Decrypt CEK using KEK private key
   - Cache CEK for future use

3. **API Encryption**:
   - Use CEK to encrypt all API request bodies (AES-256-GCM)
   - Use CEK to decrypt all API response bodies
   - Handle CEK rotation callbacks from CorpID

## Testing

```bash
npm test
```

## Security Notes

- The KEK private key must never be exposed to the frontend
- All encryption operations must happen in the backend (Lambda)
- CEK should be cached to minimize API calls to CorpID
- Always handle CEK rotation callbacks from CorpID

## CorpID Resources

- Sandbox Portal: https://sb.corpid.gov.hk/
- Documentation: https://www.digitalpolicy.gov.hk/en/our_work/success_stories/corpid_sandbox/
- Sandbox KEK PIN: 8568185550716550

## License

MIT
