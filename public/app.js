// API helpers
async function api(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// Notification system
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Load connections
async function loadConnections() {
  try {
    const data = await api('/connections');
    renderConnections(data);
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// Render connections list
function renderConnections(data) {
  const container = document.getElementById('connections-container');
  
  if (data.connections.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <p>No connections yet</p>
        <p style="font-size: 12px; margin-top: 8px;">Click "Add Connection" to get started</p>
      </div>
    `;
    return;
  }
  
  const html = `
    <ul class="connection-list">
      ${data.connections.map(conn => `
        <li class="connection-item">
          <div class="connection-info">
            <div class="connection-name">
              ${conn.name}
              ${conn.isDefault ? '<span class="badge">DEFAULT</span>' : ''}
            </div>
            <div class="connection-type">${conn.type}</div>
          </div>
          <div class="connection-actions">
            <button class="btn btn-secondary btn-small" onclick="testConnection('${conn.name}')">
              Test
            </button>
            ${!conn.isDefault ? `
              <button class="btn btn-secondary btn-small" onclick="setDefault('${conn.name}')">
                Set Default
              </button>
            ` : ''}
            <button class="btn btn-danger btn-small" onclick="deleteConnection('${conn.name}')">
              Delete
            </button>
          </div>
        </li>
      `).join('')}
    </ul>
  `;
  
  container.innerHTML = html;
}

// Load encryption key info
async function loadKeyInfo() {
  try {
    const data = await api('/key-info');
    const container = document.getElementById('key-info');
    
    if (data.useEnvVar) {
      container.innerHTML = `
        <p><strong>Encryption Key Source:</strong></p>
        <p>Environment variable: POSTGRES_CLIENT_KEY</p>
      `;
    } else if (data.keyExists) {
      container.innerHTML = `
        <p><strong>Encryption Key Location:</strong></p>
        <p style="font-family: monospace; font-size: 12px;">${data.keyPath}</p>
      `;
    } else {
      container.innerHTML = `
        <p><strong>Encryption Key:</strong></p>
        <p>Will be auto-generated on first connection save</p>
      `;
    }
  } catch (error) {
    console.error('Failed to load key info:', error);
  }
}

// Modal functions
function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Connection';
  document.getElementById('connection-form').reset();
  document.getElementById('connection-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('connection-modal').classList.remove('active');
}

function toggleConnectionType() {
  const type = document.querySelector('input[name="conn-type"]:checked').value;
  const paramsSection = document.getElementById('params-section');
  const stringSection = document.getElementById('string-section');
  
  if (type === 'params') {
    paramsSection.style.display = 'block';
    stringSection.style.display = 'none';
    // Set required attributes
    document.querySelectorAll('#params-section input').forEach(input => {
      if (input.id !== 'conn-password') input.required = true;
    });
    document.getElementById('conn-string').required = false;
  } else {
    paramsSection.style.display = 'none';
    stringSection.style.display = 'block';
    // Set required attributes
    document.querySelectorAll('#params-section input').forEach(input => {
      input.required = false;
    });
    document.getElementById('conn-string').required = true;
  }
}

// Save connection
async function saveConnection(event) {
  event.preventDefault();
  
  const name = document.getElementById('conn-name').value;
  const type = document.querySelector('input[name="conn-type"]:checked').value;
  const testFirst = document.getElementById('conn-test').checked;
  
  let connectionData;
  
  if (type === 'params') {
    const sslMode = document.getElementById('conn-ssl-mode').value;
    connectionData = {
      host: document.getElementById('conn-host').value,
      port: parseInt(document.getElementById('conn-port').value),
      database: document.getElementById('conn-database').value,
      user: document.getElementById('conn-user').value,
      password: document.getElementById('conn-password').value,
      ssl: sslMode !== 'disable',
      sslMode: sslMode
    };
  } else {
    const sslMode = document.getElementById('conn-string-ssl-mode').value;
    connectionData = {
      connectionString: document.getElementById('conn-string').value,
      ssl: sslMode !== 'disable',
      sslMode: sslMode
    };
  }
  
  try {
    await api('/connections', {
      method: 'POST',
      body: JSON.stringify({ name, connectionData, testFirst })
    });
    
    showNotification(`Connection '${name}' saved successfully!`);
    closeModal();
    loadConnections();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// Test connection
async function testConnection(name) {
  try {
    showNotification('Testing connection...', 'success');
    const result = await api(`/connections/${name}/test`, { method: 'POST' });
    
    showNotification(
      `✓ Connected to ${result.database} as ${result.user}`,
      'success'
    );
  } catch (error) {
    showNotification(`Connection failed: ${error.message}`, 'error');
  }
}

// Set default connection
async function setDefault(name) {
  try {
    await api(`/connections/${name}/default`, { method: 'PUT' });
    showNotification(`'${name}' set as default`);
    loadConnections();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// Delete connection
async function deleteConnection(name) {
  if (!confirm(`Delete connection '${name}'?`)) {
    return;
  }
  
  try {
    await api(`/connections/${name}`, { method: 'DELETE' });
    showNotification(`Connection '${name}' deleted`);
    loadConnections();
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// Close modal on background click
document.getElementById('connection-modal').addEventListener('click', (e) => {
  if (e.target.id === 'connection-modal') {
    closeModal();
  }
});

// Shutdown server
async function shutdownServer() {
  if (!confirm('Close the connection manager?')) {
    return;
  }
  
  try {
    await api('/shutdown', { method: 'POST' });
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;">
        <h1 style="color: white; margin-bottom: 16px;">✓ Done</h1>
        <p style="color: white; opacity: 0.9;">Connection manager closed. You can close this tab.</p>
      </div>
    `;
  } catch (error) {
    // Server already shut down, that's ok
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;">
        <h1 style="color: white; margin-bottom: 16px;">✓ Done</h1>
        <p style="color: white; opacity: 0.9;">Connection manager closed. You can close this tab.</p>
      </div>
    `;
  }
}

// Initialize
loadConnections();
loadKeyInfo();
