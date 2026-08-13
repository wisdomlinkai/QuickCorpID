# Document Service Implementation Guide

## Overview
This guide contains all the code needed to implement the Document Service Lambda for QuickCorpID.

## Directory Structure

```
infrastructure/lambdas/document-service/
├── package.json
├── tsconfig.json
├── index.ts
├── database.ts
├── s3-client.ts
├── types.ts
└── utils.ts
```

## File: package.json

```json
{
  "name": "document-service",
  "version": "1.0.0",
  "description": "QuickCorpID Document Service Lambda",
  "main": "index.js",
  "scripts": {
    "build": "esbuild index.ts --bundle --platform=node --target=node20 --outfile=index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.600.0",
    "@aws-sdk/client-secrets-manager": "^3.600.0",
    "@aws-sdk/s3-request-presigner": "^3.600.0",
    "pg": "^8.12.0",
    "uuid": "^10.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/pg": "^8.11.6",
    "@types/uuid": "^10.0.0",
    "esbuild": "^0.23.0",
    "typescript": "^5.5.3",
    "vitest": "^2.0.0"
  }
}
```


## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["./*.ts"],
  "exclude": ["node_modules", "dist"]
}
```
