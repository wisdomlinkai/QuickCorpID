
const { Client } = require('pg');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

// Initialize clients
let s3Client = null;
let dbClient = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-1' });
  }
  return s3Client;
}

async function getDbClient() {
  if (!dbClient) {
    dbClient = new Client({ connectionString: process.env.DATABASE_URL });
    await dbClient.connect();
  }
  return dbClient;
}

// Helper functions
function extractUserId(event) {
  return event.requestContext?.authorizer?.jwt?.claims?.sub || null;
}

function extractOrgId(event) {
  return event.pathParameters?.orgId || null;
}

function extractDocId(event) {
  return event.pathParameters?.docId || null;
}

function parseBody(event) {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body);
  } catch (e) {
    return null;
  }
}

function response(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  };
}

function success(data) {
  return response(200, { success: true, data });
}

function error(statusCode, message) {
  return response(statusCode, { success: false, error: message });
}

// S3 functions
function getS3Key(orgId, docId, version) {
  return `documents/${orgId}/${docId}/v${version}`;
}

async function generateUploadUrl(orgId, docId, version) {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET_NAME;
  const key = getS3Key(orgId, docId, version);
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { url, key };
}

async function generateDownloadUrl(s3Key) {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET_NAME;
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key
  });
  
  return await getSignedUrl(client, command, { expiresIn: 3600 });
}

async function verifyObjectExists(s3Key) {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET_NAME;
  
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: s3Key
    });
    await client.send(command);
    return true;
  } catch (e) {
    return false;
  }
}

// Main handler
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    const userId = extractUserId(event);
    if (!userId) {
      return error(401, 'Unauthorized');
    }
    
    const orgId = extractOrgId(event);
    if (!orgId) {
      return error(400, 'Organisation ID required');
    }
    
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const docId = extractDocId(event);
    
    const db = await getDbClient();
    
    // Check organisation membership
    const memberCheck = await db.query(
      'SELECT id FROM organisation_members WHERE organisation_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return error(403, 'Not a member of this organisation');
    }
    
    // Route requests
    if (method === 'POST' && path.includes('/upload-url')) {
      return await handleGetUploadUrl(db, orgId, docId);
    }
    
    if (method === 'POST' && path.includes('/confirm')) {
      return await handleConfirmUpload(db, orgId, docId, event);
    }
    
    if (method === 'POST' && !docId) {
      return await handleCreateDocument(db, orgId, userId, event);
    }
    
    if (method === 'GET' && !docId) {
      return await handleListDocuments(db, orgId, event);
    }
    
    if (method === 'GET' && docId) {
      return await handleGetDocument(db, orgId, docId);
    }
    
    if (method === 'PUT' && docId) {
      return await handleUpdateDocument(db, orgId, docId, event);
    }
    
    if (method === 'DELETE' && docId) {
      return await handleDeleteDocument(db, orgId, docId);
    }
    
    return error(404, 'Not found');
    
  } catch (e) {
    console.error('Error:', e);
    return error(500, 'Internal server error: ' + e.message);
  }
};

// Handler functions
async function handleCreateDocument(db, orgId, userId, event) {
  const body = parseBody(event);
  if (!body || !body.title || !body.type) {
    return error(400, 'Title and type are required');
  }
  
  const docId = uuidv4();
  const s3Key = getS3Key(orgId, docId, 1);
  
  const result = await db.query(
    `INSERT INTO documents (organisation_id, title, type, status, s3_key, s3_version, version, created_by)
     VALUES ($1, $2, $3, 'pending', $4, 'v1', 1, $5)
     RETURNING *`,
    [orgId, body.title, body.type, s3Key, userId]
  );
  
  return success(result.rows[0]);
}

async function handleGetUploadUrl(db, orgId, docId) {
  const docResult = await db.query(
    'SELECT * FROM documents WHERE id = $1 AND organisation_id = $2',
    [docId, orgId]
  );
  
  if (docResult.rows.length === 0) {
    return error(404, 'Document not found');
  }
  
  const doc = docResult.rows[0];
  
  if (doc.status !== 'pending') {
    return error(400, 'Document is not in pending status');
  }
  
  const { url, key } = await generateUploadUrl(orgId, docId, doc.version);
  
  return success({
    document_id: docId,
    upload_url: url,
    expires_at: new Date(Date.now() + 3600000).toISOString()
  });
}

async function handleConfirmUpload(db, orgId, docId, event) {
  const docResult = await db.query(
    'SELECT * FROM documents WHERE id = $1 AND organisation_id = $2',
    [docId, orgId]
  );
  
  if (docResult.rows.length === 0) {
    return error(404, 'Document not found');
  }
  
  const doc = docResult.rows[0];
  
  if (doc.status !== 'pending') {
    return error(400, 'Document is not in pending status');
  }
  
  const exists = await verifyObjectExists(doc.s3_key);
  if (!exists) {
    return error(400, 'Document has not been uploaded to S3');
  }
  
  const body = parseBody(event) || {};
  
  const result = await db.query(
    `UPDATE documents 
     SET status = 'uploaded', hash = $1, size_bytes = $2, mime_type = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [body.hash, body.size_bytes, body.mime_type, docId]
  );
  
  return success(result.rows[0]);
}

async function handleListDocuments(db, orgId, event) {
  const params = event.queryStringParameters || {};
  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.page_size || '20');
  const offset = (page - 1) * pageSize;
  
  const countResult = await db.query(
    'SELECT COUNT(*) FROM documents WHERE organisation_id = $1 AND status != $2',
    [orgId, 'deleted']
  );
  
  const result = await db.query(
    `SELECT * FROM documents 
     WHERE organisation_id = $1 AND status != $2
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`,
    [orgId, 'deleted', pageSize, offset]
  );
  
  return success({
    documents: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    page_size: pageSize
  });
}

async function handleGetDocument(db, orgId, docId) {
  const result = await db.query(
    'SELECT * FROM documents WHERE id = $1 AND organisation_id = $2 AND status != $3',
    [docId, orgId, 'deleted']
  );
  
  if (result.rows.length === 0) {
    return error(404, 'Document not found');
  }
  
  const doc = result.rows[0];
  
  if (doc.status === 'uploaded' || doc.status === 'verified') {
    doc.download_url = await generateDownloadUrl(doc.s3_key);
  }
  
  return success(doc);
}

async function handleUpdateDocument(db, orgId, docId, event) {
  const body = parseBody(event);
  if (!body) {
    return error(400, 'Invalid request body');
  }
  
  const updates = [];
  const values = [];
  let idx = 1;
  
  ['title', 'description', 'metadata'].forEach(field => {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${idx}`);
      values.push(body[field]);
      idx++;
    }
  });
  
  if (updates.length === 0) {
    return error(400, 'No valid fields to update');
  }
  
  updates.push('updated_at = NOW()');
  values.push(docId, orgId);
  
  const result = await db.query(
    `UPDATE documents SET ${updates.join(', ')}
     WHERE id = $${idx} AND organisation_id = $${idx + 1}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return error(404, 'Document not found');
  }
  
  return success(result.rows[0]);
}

async function handleDeleteDocument(db, orgId, docId) {
  const result = await db.query(
    `UPDATE documents 
     SET status = 'deleted', updated_at = NOW()
     WHERE id = $1 AND organisation_id = $2
     RETURNING id`,
    [docId, orgId]
  );
  
  if (result.rows.length === 0) {
    return error(404, 'Document not found');
  }
  
  return success({ deleted: true });
}
