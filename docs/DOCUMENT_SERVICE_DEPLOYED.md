# Document Service - Deployment Complete ✅

## Service Details

**Lambda Function**: `quickcorpid-document-service-dev`
**ARN**: `arn:aws:lambda:ap-southeast-1:240966654973:function:quickcorpid-document-service-dev`
**API Gateway**: `https://i7i8airnmk.execute-api.ap-southeast-1.amazonaws.com`
**Stage**: `v1`
**Base URL**: `https://i7i8airnmk.execute-api.ap-southeast-1.amazonaws.com/v1/`

## Environment Variables

- `DATABASE_URL`: Aurora PostgreSQL connection string
- `S3_BUCKET_NAME`: `quickcorpid-documents-240966654973-ap-southeast-1`

## API Endpoints

All endpoints require Cognito authentication. Include `Authorization: Bearer <token>` header.

### Create Document
```
POST /v1/organisations/{orgId}/documents
Body: {
  "title": "Document Title",
  "type": "contract|resolution|tsw_form|tax_document|annual_return|br_certificate|incorporation_doc|other"
}
Response: {
  "success": true,
  "data": { document object }
}
```

### Get Upload URL
```
POST /v1/organisations/{orgId}/documents/{docId}/upload-url
Response: {
  "success": true,
  "data": {
    "document_id": "uuid",
    "upload_url": "https://s3...",
    "expires_at": "ISO timestamp"
  }
}
```

### Confirm Upload
```
POST /v1/organisations/{orgId}/documents/{docId}/confirm
Body: {
  "hash": "sha256-hash-optional",
  "size_bytes": 12345,
  "mime_type": "application/pdf"
}
Response: {
  "success": true,
  "data": { updated document object }
}
```

### List Documents
```
GET /v1/organisations/{orgId}/documents?page=1&page_size=20
Response: {
  "success": true,
  "data": {
    "documents": [...],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### Get Document
```
GET /v1/organisations/{orgId}/documents/{docId}
Response: {
  "success": true,
  "data": {
    ...document,
    "download_url": "https://s3..." // if uploaded
  }
}
```

### Update Document
```
PUT /v1/organisations/{orgId}/documents/{docId}
Body: {
  "title": "New Title",
  "description": "Description",
  "metadata": {}
}
Response: {
  "success": true,
  "data": { updated document object }
}
```

### Delete Document
```
DELETE /v1/organisations/{orgId}/documents/{docId}
Response: {
  "success": true,
  "data": { "deleted": true }
}
```

## Upload Flow

1. **Create Document** → Returns document ID with status `pending`
2. **Get Upload URL** → Returns pre-signed S3 URL (valid for 1 hour)
3. **Upload to S3** → Use PUT request with the pre-signed URL
4. **Confirm Upload** → Updates document status to `uploaded`

## Security

- All requests must include valid Cognito JWT token
- User must be member of the organisation
- Documents encrypted with KMS at rest
- Pre-signed URLs expire after 1 hour
- All actions logged for audit

## Testing

```bash
# Test Lambda directly
aws lambda invoke --function-name quickcorpid-document-service-dev \
  --payload file://test-event.json output.json

# Test via API Gateway (requires auth token)
curl -X GET \
  https://i7i8airnmk.execute-api.ap-southeast-1.amazonaws.com/v1/organisations/{orgId}/documents \
  -H "Authorization: Bearer YOUR_COGNITO_TOKEN"
```

## Next Steps

1. **Integrate with Frontend** (Sprint 4)
   - Build document upload UI
   - Connect to API endpoints
   - Handle authentication

2. **Add Advanced Features**
   - Document versioning
   - Document sharing
   - Search and filtering
   - Bulk operations

3. **Monitoring**
   - CloudWatch logs
   - X-Ray tracing
   - Error alerts

## Deployed Services Summary

| Service | API Endpoint | Status |
|---------|--------------|--------|
| Auth Service | `https://v3sz1loura.execute-api.ap-southeast-1.amazonaws.com/v1/` | ✅ Active |
| Organisation Service | `https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1/` | ✅ Active |
| CorpID Service | `https://y4zdzgdoff.execute-api.ap-southeast-1.amazonaws.com/v1/` | ✅ Active |
| Document Service | `https://i7i8airnmk.execute-api.ap-southeast-1.amazonaws.com/v1/` | ✅ Active |

## Infrastructure

- **Region**: ap-southeast-1 (Singapore)
- **Database**: Aurora Serverless v2 PostgreSQL
- **S3**: Document storage with KMS encryption
- **VPC**: Private subnets for database access
- **IAM**: Least-privilege roles per service
