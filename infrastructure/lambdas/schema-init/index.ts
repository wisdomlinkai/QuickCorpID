import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';

interface Event {
  RequestType: 'Create' | 'Update' | 'Delete';
  PhysicalResourceId?: string;
  ResourceProperties: Record<string, string>;
}

interface Response {
  PhysicalResourceId: string;
  Data: Record<string, string>;
  IsComplete?: boolean;
}

const secretsManager = new SecretsManager({ region: process.env.AWS_REGION });

export const handler = async (event: Event): Promise<Response> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.RequestType === 'Delete') {
    return {
      PhysicalResourceId: event.PhysicalResourceId || 'schema-init',
      Data: { Status: 'Deleted' },
    };
  }

  const secretArn = process.env.DATABASE_SECRET_ARN!;
  const endpoint = process.env.DATABASE_ENDPOINT!;
  const dbName = process.env.DATABASE_NAME!;

  // Get database credentials from Secrets Manager
  const secretResponse = await secretsManager.getSecretValue({ SecretId: secretArn });
  const credentials = JSON.parse(secretResponse.SecretString || '{}');

  // Extract host and port from endpoint
  const [host, portStr] = endpoint.split(':');
  const port = parseInt(portStr || '5432', 10);

  // Connect to database
  const client = new Client({
    host,
    port,
    database: dbName,
    user: credentials.username,
    password: credentials.password,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID extension enabled');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cognito_sub VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        preferred_language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Users table created');

    // Create organisations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organisations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        br_number VARCHAR(8) UNIQUE NOT NULL,
        cr_number VARCHAR(8),
        corpid_identifier VARCHAR(128),
        business_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Organisations table created');

    // Create organisation_members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organisation_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'viewer',
        status VARCHAR(50) DEFAULT 'pending',
        invited_by UUID REFERENCES users(id),
        joined_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, org_id)
      )
    `);
    console.log('Organisation members table created');

    // Create corpid_connections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS corpid_connections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        corp_id_token_ref VARCHAR(255),
        connection_status VARCHAR(50),
        last_synced_at TIMESTAMPTZ,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('CorpID connections table created');

    // Create documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        uploaded_by UUID REFERENCES users(id),
        type VARCHAR(50),
        title VARCHAR(255),
        s3_key VARCHAR(512) NOT NULL,
        hash VARCHAR(128),
        version INTEGER DEFAULT 1,
        status VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Documents table created');

    // Create signing_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS signing_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        document_id UUID REFERENCES documents(id),
        status VARCHAR(50),
        signers JSONB,
        corpid_reference VARCHAR(128),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Signing requests table created');

    // Create compliance_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        type VARCHAR(50),
        title VARCHAR(255),
        due_date DATE NOT NULL,
        status VARCHAR(50),
        metadata JSONB,
        reminder_sent_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Compliance items table created');

    // Create audit_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID REFERENCES organisations(id),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Audit logs table created');

    // Create subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        org_id UUID REFERENCES organisations(id),
        plan VARCHAR(50),
        status VARCHAR(50),
        stripe_subscription_id VARCHAR(255),
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Subscriptions table created');

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50),
        title VARCHAR(255),
        message TEXT,
        read_at TIMESTAMPTZ,
        action_url VARCHAR(512),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Notifications table created');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_org_members_user ON organisation_members(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_org_members_org ON organisation_members(org_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_signing_requests_org ON signing_requests(org_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_compliance_org ON compliance_items(org_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_compliance_due_date ON compliance_items(due_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    console.log('Indexes created');

    await client.end();

    return {
      PhysicalResourceId: 'schema-init-' + Date.now(),
      Data: {
        Status: 'Success',
        Message: 'Database schema initialized successfully',
      },
    };
  } catch (error) {
    console.error('Error initializing schema:', error);
    await client.end().catch(() => {});
    throw error;
  }
};
