const { Pool } = require('pg');

/**
 * Create a connection pool from connection data
 */
function createPool(connectionData) {
  // Handle SSL configuration
  let sslConfig = false;
  if (connectionData.ssl) {
    if (typeof connectionData.ssl === 'object') {
      sslConfig = connectionData.ssl;
    } else if (connectionData.sslMode === 'disable') {
      sslConfig = false;
    } else if (connectionData.sslMode === 'no-verify') {
      sslConfig = { rejectUnauthorized: false };
    } else {
      sslConfig = true;
    }
  }
  
  if (connectionData.connectionString) {
    return new Pool({ 
      connectionString: connectionData.connectionString,
      ssl: sslConfig
    });
  }
  
  return new Pool({
    host: connectionData.host,
    port: connectionData.port,
    database: connectionData.database,
    user: connectionData.user,
    password: connectionData.password,
    ssl: sslConfig
  });
}

/**
 * Test a connection
 */
async function testConnection(connectionData) {
  const pool = createPool(connectionData);
  try {
    const result = await pool.query('SELECT version(), current_database(), current_user');
    await pool.end();
    return {
      success: true,
      version: result.rows[0].version,
      database: result.rows[0].current_database,
      user: result.rows[0].current_user
    };
  } catch (error) {
    await pool.end();
    throw error;
  }
}

/**
 * Execute a query
 */
async function executeQuery(connectionData, query) {
  const pool = createPool(connectionData);
  try {
    const result = await pool.query(query);
    return result;
  } finally {
    await pool.end();
  }
}

/**
 * Get database info
 */
async function getDatabaseInfo(connectionData) {
  const query = `
    SELECT 
      version() as version,
      current_database() as database,
      current_user as user,
      inet_server_addr() as host,
      inet_server_port() as port;
  `;
  const result = await executeQuery(connectionData, query);
  return result.rows[0];
}

/**
 * List all tables, optionally filtered by schema
 */
async function listTables(connectionData, schema) {
  if (schema) {
    const query = `
      SELECT
        schemaname as schema,
        tablename  as table,
        tableowner as owner
      FROM pg_catalog.pg_tables
      WHERE schemaname = $1
      ORDER BY tablename;
    `;
    const result = await executeQuery(connectionData, { text: query, values: [schema] });
    return result.rows;
  }

  const query = `
    SELECT
      schemaname as schema,
      tablename  as table,
      tableowner as owner
    FROM pg_catalog.pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename;
  `;
  const result = await executeQuery(connectionData, query);
  return result.rows;
}

/**
 * List all views, optionally filtered by schema
 */
async function listViews(connectionData, schema) {
  if (schema) {
    const query = `
      SELECT
        schemaname as schema,
        viewname   as view,
        viewowner  as owner
      FROM pg_catalog.pg_views
      WHERE schemaname = $1
      ORDER BY viewname;
    `;
    const result = await executeQuery(connectionData, { text: query, values: [schema] });
    return result.rows;
  }

  const query = `
    SELECT
      schemaname as schema,
      viewname   as view,
      viewowner  as owner
    FROM pg_catalog.pg_views
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, viewname;
  `;
  const result = await executeQuery(connectionData, query);
  return result.rows;
}

/**
 * Describe table columns, with optional schema qualification
 */
async function describeTable(connectionData, tableName, schema = 'public') {
  const query = `
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_name   = $1
      AND table_schema = $2
    ORDER BY ordinal_position;
  `;
  const result = await executeQuery(connectionData, { text: query, values: [tableName, schema] });
  return result.rows;
}

/**
 * List indexes on a table
 */
async function listIndexes(connectionData, tableName, schema = 'public') {
  const query = `
    SELECT
      indexname  as index,
      indexdef   as definition
    FROM pg_indexes
    WHERE tablename  = $1
      AND schemaname = $2
    ORDER BY indexname;
  `;
  const result = await executeQuery(connectionData, { text: query, values: [tableName, schema] });
  return result.rows;
}

module.exports = {
  createPool,
  testConnection,
  executeQuery,
  getDatabaseInfo,
  listTables,
  listViews,
  describeTable,
  listIndexes,
};
