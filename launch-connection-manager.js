#!/usr/bin/env node

const express = require('express');
const open = require('open');
const path = require('path');
const core = require('./core');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// List connections (names only)
app.get('/api/connections', (req, res) => {
  try {
    const list = core.listConnections();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test a connection
app.post('/api/connections/:name/test', async (req, res) => {
  try {
    const connection = core.getConnection(req.params.name);
    const result = await core.testConnection(connection);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add or update connection
app.post('/api/connections', async (req, res) => {
  try {
    const { name, connectionData, testFirst } = req.body;
    
    if (!name || !/^[a-z0-9-]+$/.test(name)) {
      return res.status(400).json({ 
        error: 'Invalid name. Use lowercase letters, numbers, and hyphens only.' 
      });
    }
    
    // Test if requested
    if (testFirst) {
      try {
        await core.testConnection(connectionData);
      } catch (error) {
        return res.status(400).json({ 
          error: `Connection test failed: ${error.message}` 
        });
      }
    }
    
    core.addConnection(name, connectionData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove connection
app.delete('/api/connections/:name', (req, res) => {
  try {
    core.removeConnection(req.params.name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set default connection
app.put('/api/connections/:name/default', (req, res) => {
  try {
    core.setDefault(req.params.name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get encryption key info
app.get('/api/key-info', (req, res) => {
  const os = require('os');
  const fs = require('fs');
  const keyPath = path.join(__dirname, '.key');
  
  res.json({
    keyPath: keyPath,
    keyExists: fs.existsSync(keyPath)
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Shutdown endpoint
app.post('/api/shutdown', (req, res) => {
  res.json({ success: true, message: 'Server shutting down...' });
  console.log('\n👋 Shutting down server...');
  setTimeout(() => {
    server.close(() => {
      console.log('✅ Server stopped\n');
      process.exit(0);
    });
  }, 500);
});

const PORT = process.env.POSTGRES_CLIENT_PORT || 9876;

const server = app.listen(PORT, 'localhost', async () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🔐 PostgreSQL Connection Manager`);
  console.log(`\n🌐 Server running at ${url}`);
  console.log(`\n⚠️  This server is private - the AI cannot see your credentials`);
  console.log(`   Click the "Done" button in the UI when finished\n`);
  
  // Try multiple methods to open browser
  try {
    await open(url);
    console.log('✅ Browser opened\n');
  } catch (error) {
    // Fallback for WSL/Linux environments
    const { exec } = require('child_process');
    const commands = [
      `xdg-open "${url}"`,
      `sensible-browser "${url}"`,
      `wslview "${url}"`,  // WSL
      `cmd.exe /c start "${url}"`,  // WSL fallback
    ];
    
    let opened = false;
    for (const cmd of commands) {
      try {
        exec(cmd, (err) => {
          if (!err && !opened) {
            opened = true;
            console.log('✅ Browser opened\n');
          }
        });
        // Wait a bit to see if it worked
        await new Promise(resolve => setTimeout(resolve, 500));
        if (opened) break;
      } catch (e) {
        // Try next command
      }
    }
    
    if (!opened) {
      console.log(`⚠️  Could not auto-open browser.`);
      console.log(`   Please manually visit: ${url}\n`);
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('\n👋 Server stopped\n');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('\n👋 Server stopped\n');
    process.exit(0);
  });
});
