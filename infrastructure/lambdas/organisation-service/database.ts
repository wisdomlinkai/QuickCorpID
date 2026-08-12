import { Client } from 'pg';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager({ region: process.env.AWS_REGION });

let cachedClient: Client | null = null;

export async function getDatabaseClient(): Promise<Client> {
  if (cachedClient) {
    return cachedClient;
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

  await client.connect();
  cachedClient = client;
  return client;
}

export async function closeDatabaseClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.end();
    cachedClient = null;
  }
}

// User operations
export async function getUserByCognitoSub(cognitoSub: string): Promise<{ id: string; email: string; name: string | null } | null> {
  const client = await getDatabaseClient();
  const result = await client.query(
    'SELECT id, email, name FROM users WHERE cognito_sub = $1',
    [cognitoSub]
  );
  return result.rows[0] || null;
}

export async function createUser(cognitoSub: string, email: string, name?: string): Promise<{ id: string; email: string; name: string | null }> {
  const client = await getDatabaseClient();
  const result = await client.query(
    `INSERT INTO users (cognito_sub, email, name) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (cognito_sub) DO UPDATE SET email = $2, name = COALESCE($3, users.name)
     RETURNING id, email, name`,
    [cognitoSub, email, name || null]
  );
  return result.rows[0];
}

// Organisation operations
export async function createOrganisation(
  userId: string,
  data: { name: string; br_number: string; business_type: string; cr_number?: string }
): Promise<{ id: string; name: string; br_number: string; business_type: string }> {
  const client = await getDatabaseClient();
  
  await client.query('BEGIN');
  
  try {
    // Create organisation
    const orgResult = await client.query(
      `INSERT INTO organisations (name, br_number, business_type, cr_number, status) 
       VALUES ($1, $2, $3, $4, 'pending') 
       RETURNING id, name, br_number, business_type`,
      [data.name, data.br_number, data.business_type, data.cr_number || null]
    );
    
    const organisation = orgResult.rows[0];
    
    // Add user as owner
    await client.query(
      `INSERT INTO organisation_members (user_id, org_id, role, status, joined_at) 
       VALUES ($1, $2, 'owner', 'active', NOW())`,
      [userId, organisation.id]
    );
    
    // Create audit log
    await client.query(
      `INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id, details) 
       VALUES ($1, $2, 'organisation.created', 'organisation', $3, $4)`,
      [organisation.id, userId, organisation.id, JSON.stringify({ name: data.name, br_number: data.br_number })]
    );
    
    await client.query('COMMIT');
    return organisation;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function getOrganisation(orgId: string, userId: string): Promise<Record<string, unknown> | null> {
  const client = await getDatabaseClient();
  const result = await client.query(
    `SELECT o.*, om.role as user_role, 
            (SELECT COUNT(*) FROM organisation_members WHERE org_id = o.id AND status = 'active') as member_count,
            (SELECT COUNT(*) > 0 FROM corpid_connections WHERE org_id = o.id) as corpid_connected
     FROM organisations o
     JOIN organisation_members om ON om.org_id = o.id AND om.user_id = $2 AND om.status = 'active'
     WHERE o.id = $1`,
    [orgId, userId]
  );
  return result.rows[0] || null;
}

export async function listUserOrganisations(userId: string): Promise<Record<string, unknown>[]> {
  const client = await getDatabaseClient();
  const result = await client.query(
    `SELECT o.*, om.role as user_role,
            (SELECT COUNT(*) FROM organisation_members WHERE org_id = o.id AND status = 'active') as member_count,
            (SELECT COUNT(*) > 0 FROM corpid_connections WHERE org_id = o.id) as corpid_connected
     FROM organisations o
     JOIN organisation_members om ON om.org_id = o.id AND om.user_id = $1 AND om.status = 'active'
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function updateOrganisation(
  orgId: string,
  userId: string,
  data: { name?: string; business_type?: string; status?: string; metadata?: Record<string, unknown> }
): Promise<Record<string, unknown> | null> {
  const client = await getDatabaseClient();
  
  const updates: string[] = [];
  const values: unknown[] = [orgId, userId];
  let paramIndex = 3;

  if (data.name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.business_type) {
    updates.push(`business_type = $${paramIndex++}`);
    values.push(data.business_type);
  }
  if (data.status) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }
  if (data.metadata) {
    updates.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(data.metadata));
  }

  if (updates.length === 0) {
    return getOrganisation(orgId, userId);
  }

  updates.push(`updated_at = NOW()`);

  const result = await client.query(
    `UPDATE organisations 
     SET ${updates.join(', ')} 
     FROM organisation_members om 
     WHERE organisations.id = $1 AND om.org_id = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin')
     RETURNING organisations.*`,
    values
  );

  return result.rows[0] || null;
}

export async function deleteOrganisation(orgId: string, userId: string): Promise<boolean> {
  const client = await getDatabaseClient();
  
  await client.query('BEGIN');
  
  try {
    // Check if user is owner
    const memberCheck = await client.query(
      `SELECT role FROM organisation_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'`,
      [orgId, userId]
    );
    
    if (!memberCheck.rows[0] || memberCheck.rows[0].role !== 'owner') {
      await client.query('ROLLBACK');
      return false;
    }
    
    // Soft delete by setting status to 'closed'
    const result = await client.query(
      `UPDATE organisations SET status = 'closed', updated_at = NOW() WHERE id = $1`,
      [orgId]
    );
    
    await client.query('COMMIT');
    return result.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

// Member operations
export async function inviteMember(
  orgId: string,
  inviterId: string,
  data: { email: string; role: string }
): Promise<Record<string, unknown>> {
  const client = await getDatabaseClient();
  
  await client.query('BEGIN');
  
  try {
    // Check if inviter has permission
    const inviterCheck = await client.query(
      `SELECT role FROM organisation_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'`,
      [orgId, inviterId]
    );
    
    if (!inviterCheck.rows[0] || !['owner', 'admin'].includes(inviterCheck.rows[0].role)) {
      throw new Error('Insufficient permissions to invite members');
    }
    
    // Find or create user by email
    let user = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    );
    
    if (!user.rows[0]) {
      // Create pending user
      user = await client.query(
        'INSERT INTO users (cognito_sub, email, name) VALUES ($1, $2, $3) RETURNING id',
        [`pending-${Date.now()}`, data.email.toLowerCase(), null]
      );
    }
    
    const userId = user.rows[0].id;
    
    // Check if already a member
    const existingMember = await client.query(
      'SELECT id FROM organisation_members WHERE org_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    
    if (existingMember.rows[0]) {
      throw new Error('User is already a member of this organisation');
    }
    
    // Add member
    const result = await client.query(
      `INSERT INTO organisation_members (user_id, org_id, role, status, invited_by) 
       VALUES ($1, $2, $3, 'pending', $4) 
       RETURNING id, user_id, org_id, role, status, invited_by, created_at`,
      [userId, orgId, data.role, inviterId]
    );
    
    // Create audit log
    await client.query(
      `INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id, details) 
       VALUES ($1, $2, 'member.invited', 'organisation_member', $3, $4)`,
      [orgId, inviterId, result.rows[0].id, JSON.stringify({ email: data.email, role: data.role })]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function listOrganisationMembers(orgId: string, userId: string): Promise<Record<string, unknown>[]> {
  const client = await getDatabaseClient();
  
  // Verify user is a member
  const memberCheck = await client.query(
    'SELECT 1 FROM organisation_members WHERE org_id = $1 AND user_id = $2 AND status = \'active\'',
    [orgId, userId]
  );
  
  if (!memberCheck.rows[0]) {
    return [];
  }
  
  const result = await client.query(
    `SELECT om.*, u.email, u.name 
     FROM organisation_members om 
     JOIN users u ON u.id = om.user_id 
     WHERE om.org_id = $1 
     ORDER BY om.created_at DESC`,
    [orgId]
  );
  
  return result.rows;
}

export async function updateMemberRole(
  orgId: string,
  memberId: string,
  requesterId: string,
  newRole: string
): Promise<Record<string, unknown> | null> {
  const client = await getDatabaseClient();
  
  await client.query('BEGIN');
  
  try {
    // Check if requester has permission
    const requesterCheck = await client.query(
      `SELECT role FROM organisation_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'`,
      [orgId, requesterId]
    );
    
    if (!requesterCheck.rows[0] || !['owner', 'admin'].includes(requesterCheck.rows[0].role)) {
      throw new Error('Insufficient permissions to update member role');
    }
    
    // Update role
    const result = await client.query(
      `UPDATE organisation_members 
       SET role = $3, updated_at = NOW() 
       WHERE org_id = $1 AND id = $2 AND status = 'active' 
       RETURNING *`,
      [orgId, memberId, newRole]
    );
    
    if (result.rows[0]) {
      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id, details) 
         VALUES ($1, $2, 'member.role_updated', 'organisation_member', $3, $4)`,
        [orgId, requesterId, memberId, JSON.stringify({ new_role: newRole })]
      );
    }
    
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function removeMember(
  orgId: string,
  memberId: string,
  requesterId: string
): Promise<boolean> {
  const client = await getDatabaseClient();
  
  await client.query('BEGIN');
  
  try {
    // Check if requester has permission
    const requesterCheck = await client.query(
      `SELECT role FROM organisation_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'`,
      [orgId, requesterId]
    );
    
    if (!requesterCheck.rows[0] || !['owner', 'admin'].includes(requesterCheck.rows[0].role)) {
      throw new Error('Insufficient permissions to remove members');
    }
    
    // Get member to check if it's the last owner
    const memberCheck = await client.query(
      'SELECT role, user_id FROM organisation_members WHERE org_id = $1 AND id = $2',
      [orgId, memberId]
    );
    
    if (!memberCheck.rows[0]) {
      await client.query('ROLLBACK');
      return false;
    }
    
    // Don't allow removing last owner
    if (memberCheck.rows[0].role === 'owner') {
      const ownerCount = await client.query(
        'SELECT COUNT(*) FROM organisation_members WHERE org_id = $1 AND role = \'owner\' AND status = \'active\'',
        [orgId]
      );
      
      if (parseInt(ownerCount.rows[0].count) <= 1) {
        throw new Error('Cannot remove the last owner of the organisation');
      }
    }
    
    // Remove member
    const result = await client.query(
      'DELETE FROM organisation_members WHERE org_id = $1 AND id = $2',
      [orgId, memberId]
    );
    
    if (result.rowCount > 0) {
      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id, details) 
         VALUES ($1, $2, 'member.removed', 'organisation_member', $3, $4)`,
        [orgId, requesterId, memberId, JSON.stringify({ removed_user_id: memberCheck.rows[0].user_id })]
      );
    }
    
    await client.query('COMMIT');
    return result.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
