// ── API ───────────────────────────────────────────────────────────────────────

async function api(endpoint, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

function showNotification(message, type = 'success') {
  document.querySelectorAll('.notification').forEach(n => n.remove());
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── State ─────────────────────────────────────────────────────────────────────

let connectionsData = [];
let selectedIndex   = -1;

// ── Render connections ────────────────────────────────────────────────────────

function renderConnections(data) {
  connectionsData = data.connections;
  const container = document.getElementById('connections-container');
  const countEl   = document.getElementById('conn-count');

  if (countEl) {
    countEl.textContent = connectionsData.length
      ? `${connectionsData.length} connection${connectionsData.length !== 1 ? 's' : ''}`
      : '';
  }

  if (connectionsData.length === 0) {
    selectedIndex = -1;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-box">
          No connections configured.<br>
          Press <kbd style="border:1px solid var(--border);padding:0 4px;color:var(--accent);font-family:inherit;">[A]</kbd> or click Add Connection to get started.
        </div>
      </div>`;
    return;
  }

  if (selectedIndex < 0) selectedIndex = 0;
  selectedIndex = Math.min(selectedIndex, connectionsData.length - 1);

  container.innerHTML = `
    <table class="conn-table">
      <thead>
        <tr>
          <th>NAME</th>
          <th>TYPE</th>
          <th>ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        ${connectionsData.map((conn, i) => `
          <tr class="conn-row${i === selectedIndex ? ' selected' : ''}"
              data-index="${i}"
              onclick="selectRow(${i})">
            <td>
              <span class="conn-cursor">${i === selectedIndex ? '▶' : ' '}</span>
              <span class="conn-name">${conn.name}</span>
              ${conn.isDefault ? '<span class="badge-default">[DEFAULT]</span>' : ''}
            </td>
            <td><span class="conn-type">${conn.type}</span></td>
            <td>
              <div class="conn-actions">
                <button class="btn" onclick="event.stopPropagation(); testConnection('${conn.name}')">[T]est</button>
                ${!conn.isDefault
                  ? `<button class="btn" onclick="event.stopPropagation(); setDefault('${conn.name}')">[★] Default</button>`
                  : ''}
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteConnection('${conn.name}')">[D]el</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

function selectRow(index) {
  selectedIndex = index;
  document.querySelectorAll('.conn-row').forEach((row, i) => {
    row.classList.toggle('selected', i === index);
    const cursor = row.querySelector('.conn-cursor');
    if (cursor) cursor.textContent = i === index ? '▶' : ' ';
  });
}

// ── Load data ─────────────────────────────────────────────────────────────────

async function loadConnections() {
  try {
    renderConnections(await api('/connections'));
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

async function loadKeyInfo() {
  try {
    const data = await api('/key-info');
    const el   = document.getElementById('key-info');
    el.textContent = data.keyExists
      ? data.keyPath
      : 'Auto-generated on first connection save';
    el.style.color = data.keyExists ? '' : 'var(--fg-dim)';
  } catch (e) {
    console.error('Failed to load key info:', e);
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openAddModal() {
  document.getElementById('modal-title').textContent = 'ADD CONNECTION';
  document.getElementById('connection-form').reset();
  // Reset visibility
  document.getElementById('params-section').style.display = 'block';
  document.getElementById('string-section').style.display  = 'none';
  document.getElementById('params-ssl-row').style.display  = 'block';
  document.getElementById('connection-modal').classList.add('active');
  setTimeout(() => document.getElementById('conn-name').focus(), 50);
}

function closeModal() {
  document.getElementById('connection-modal').classList.remove('active');
}

function toggleConnectionType() {
  const type        = document.querySelector('input[name="conn-type"]:checked').value;
  const paramsBlock = document.getElementById('params-section');
  const stringBlock = document.getElementById('string-section');
  const sslRow      = document.getElementById('params-ssl-row');

  if (type === 'params') {
    paramsBlock.style.display = 'block';
    stringBlock.style.display = 'none';
    sslRow.style.display      = 'block';
    document.querySelectorAll('#params-section input').forEach(i => {
      if (i.id !== 'conn-password') i.required = true;
    });
    document.getElementById('conn-string').required = false;
  } else {
    paramsBlock.style.display = 'none';
    stringBlock.style.display = 'block';
    sslRow.style.display      = 'none';
    document.querySelectorAll('#params-section input').forEach(i => i.required = false);
    document.getElementById('conn-string').required = true;
  }
}

// ── Save connection ───────────────────────────────────────────────────────────

async function saveConnection(event) {
  event.preventDefault();

  const name      = document.getElementById('conn-name').value;
  const type      = document.querySelector('input[name="conn-type"]:checked').value;
  const testFirst = document.getElementById('conn-test').checked;

  let connectionData;
  if (type === 'params') {
    const sslMode    = document.getElementById('conn-ssl-mode').value;
    connectionData = {
      host:     document.getElementById('conn-host').value,
      port:     parseInt(document.getElementById('conn-port').value),
      database: document.getElementById('conn-database').value,
      user:     document.getElementById('conn-user').value,
      password: document.getElementById('conn-password').value,
      ssl:      sslMode !== 'disable',
      sslMode,
    };
  } else {
    const sslMode    = document.getElementById('conn-string-ssl-mode').value;
    connectionData = {
      connectionString: document.getElementById('conn-string').value,
      ssl:              sslMode !== 'disable',
      sslMode,
    };
  }

  try {
    await api('/connections', {
      method: 'POST',
      body:   JSON.stringify({ name, connectionData, testFirst }),
    });
    showNotification(`Connection '${name}' saved`);
    closeModal();
    loadConnections();
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

// ── Connection actions ────────────────────────────────────────────────────────

async function testConnection(name) {
  showNotification(`Testing ${name}...`);
  try {
    const r = await api(`/connections/${name}/test`, { method: 'POST' });
    showNotification(`✓ ${name} → ${r.database} (${r.user})`);
  } catch (e) {
    showNotification(`${name}: ${e.message}`, 'error');
  }
}

async function setDefault(name) {
  try {
    await api(`/connections/${name}/default`, { method: 'PUT' });
    showNotification(`'${name}' is now the default`);
    loadConnections();
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

async function deleteConnection(name) {
  if (!confirm(`Delete connection '${name}'?`)) return;
  try {
    await api(`/connections/${name}`, { method: 'DELETE' });
    showNotification(`'${name}' deleted`);
    if (selectedIndex >= connectionsData.length - 1) selectedIndex--;
    loadConnections();
  } catch (e) {
    showNotification(e.message, 'error');
  }
}

// ── Shutdown ──────────────────────────────────────────────────────────────────

async function shutdownServer() {
  if (!confirm('Close the connection manager?')) return;
  try { await api('/shutdown', { method: 'POST' }); } catch (_) { /* already closing */ }
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                height:100vh;gap:12px;font-family:'Courier New',monospace;background:#1e2030;color:#a5adcb;">
      <div style="border:1px solid #363b54;padding:28px 40px;text-align:center;background:#24273a;">
        <div style="color:#8aadf4;font-size:13px;margin-bottom:10px;letter-spacing:1px;">psql-manager</div>
        <div style="color:#cad3f5;margin-bottom:6px;">Session closed.</div>
        <div style="color:#6e738d;font-size:11px;">All credentials remain encrypted at rest.</div>
        <div style="color:#6e738d;font-size:11px;margin-top:4px;">You can close this tab.</div>
      </div>
    </div>`;
}

// ── Keyboard navigation ───────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  // Don't intercept when typing in a form field
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

  const modalOpen = document.getElementById('connection-modal').classList.contains('active');

  if (modalOpen) {
    if (e.key === 'Escape') closeModal();
    return;
  }

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      if (selectedIndex > 0) selectRow(selectedIndex - 1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (selectedIndex < connectionsData.length - 1) selectRow(selectedIndex + 1);
      break;
    case 'a': case 'A':
      openAddModal();
      break;
    case 't': case 'T':
      if (connectionsData[selectedIndex]) testConnection(connectionsData[selectedIndex].name);
      break;
    case 'd': case 'D': case 'Delete':
      if (connectionsData[selectedIndex]) deleteConnection(connectionsData[selectedIndex].name);
      break;
    case 's': case 'S':
      if (connectionsData[selectedIndex] && !connectionsData[selectedIndex].isDefault)
        setDefault(connectionsData[selectedIndex].name);
      break;
    case 'F10':
    case 'q': case 'Q':
      shutdownServer();
      break;
  }
});

// Close modal on backdrop click
document.getElementById('connection-modal').addEventListener('click', (e) => {
  if (e.target.id === 'connection-modal') closeModal();
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadConnections();
loadKeyInfo();
