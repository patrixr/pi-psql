const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('./crypto');

const STORAGE_FILE = path.join(__dirname, '..', 'connections.enc');

/**
 * Load and decrypt connections
 */
function loadConnections() {
  if (!fs.existsSync(STORAGE_FILE)) {
    return { connections: {}, default: null };
  }
  
  try {
    const encryptedData = fs.readFileSync(STORAGE_FILE, 'utf8');
    const decryptedData = decrypt(encryptedData);
    return JSON.parse(decryptedData);
  } catch (error) {
    throw new Error(`Failed to load connections: ${error.message}`);
  }
}

/**
 * Encrypt and save connections
 */
function saveConnections(data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    const encryptedData = encrypt(jsonData);
    fs.writeFileSync(STORAGE_FILE, encryptedData, { mode: 0o600 });
  } catch (error) {
    throw new Error(`Failed to save connections: ${error.message}`);
  }
}

/**
 * Add or update a connection
 */
function addConnection(name, connectionData) {
  const data = loadConnections();
  data.connections[name] = connectionData;
  
  // Set as default if it's the first connection
  if (!data.default) {
    data.default = name;
  }
  
  saveConnections(data);
}

/**
 * Remove a connection
 */
function removeConnection(name) {
  const data = loadConnections();
  
  if (!data.connections[name]) {
    throw new Error(`Connection '${name}' not found`);
  }
  
  delete data.connections[name];
  
  // Update default if we removed it
  if (data.default === name) {
    const remaining = Object.keys(data.connections);
    data.default = remaining.length > 0 ? remaining[0] : null;
  }
  
  saveConnections(data);
}

/**
 * Get a specific connection (returns decrypted data)
 */
function getConnection(name) {
  const data = loadConnections();
  
  if (!name && data.default) {
    name = data.default;
  }
  
  if (!name) {
    throw new Error('No connection specified and no default set');
  }
  
  const connection = data.connections[name];
  if (!connection) {
    throw new Error(`Connection '${name}' not found`);
  }
  
  return { name, ...connection };
}

/**
 * Set default connection
 */
function setDefault(name) {
  const data = loadConnections();
  
  if (!data.connections[name]) {
    throw new Error(`Connection '${name}' not found`);
  }
  
  data.default = name;
  saveConnections(data);
}

/**
 * List all connections (names only, no credentials)
 */
function listConnections() {
  const data = loadConnections();
  return {
    default: data.default,
    connections: Object.keys(data.connections).map(name => ({
      name,
      isDefault: name === data.default,
      type: data.connections[name].connectionString ? 'connection-string' : 'parameters'
    }))
  };
}

module.exports = {
  loadConnections,
  saveConnections,
  addConnection,
  removeConnection,
  getConnection,
  setDefault,
  listConnections
};
