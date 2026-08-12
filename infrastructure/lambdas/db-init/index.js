const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const fs = require('fs');
const path = require('path');

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });

async function getDatabaseCredentials() {
  const secretArn = process.env.DATABASE_SECRET_ARN;
  if (!secretArn) {
    throw new Error('DATABASE_SECRET_ARN environment variable not set');
  }

  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsClient.send(command);
  
  if (!response.SecretString) {
    throw new Error('Database secret not found');
  }

  return JSON.parse(response.SecretString);
}

async function handler(event) {
  let client;
  
  try {
    console.log('Starting database schema initialization...');
    
    const credentials = await getDatabaseCredentials();
    const endpoint = process.env.DATABASE_ENDPOINT || '';
    const [host, portStr] = endpoint.split(':');
    const port = parseInt(portStr || '5432', 10);
    const database = process.env.DATABASE_NAME || 'quickcorpid';

    client = new Client({
      host,
      port,
      database,
      user: credentials.username,
      password: credentials.password,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log('Connected to database');

    // Read and execute schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        successCount++;
      } catch (error) {
        // Ignore "already exists" errors
        if (error.code === '42P07' || error.code === '42710') {
          console.log(`Object already exists, skipping: ${error.message}`);
          successCount++;
        } else {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      }
    }

    console.log(`Schema initialization complete. Success: ${successCount}, Errors: ${errorCount}`);

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('Tables created:', result.rows.map(r => r.table_name).join(', '));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database schema initialized successfully',
        tablesCreated: result.rows.length,
        successCount,
        errorCount,
      }),
    };

  } catch (error) {
    console.error('Error initializing database schema:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
    };
  } finally {
    if (client) {
      await client.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = { handler };
