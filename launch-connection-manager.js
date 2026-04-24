#!/usr/bin/env node
'use strict';

const express = require('express');
const open    = require('open');
const path    = require('path');
const core    = require('./core');

/**
 * Start the connection manager web server.
 * Returns a Promise that resolves when the user clicks Done (server shuts down).
 */
function start() {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    // List connections (names only — no credentials)
    app.get('/api/connections', (req, res) => {
      try {
        res.json(core.listConnections());
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // Test a connection
    app.post('/api/connections/:name/test', async (req, res) => {
      try {
        const conn   = core.getConnection(req.params.name);
        const result = await core.testConnection(conn);
        res.json({ success: true, ...result });
      } catch (e) {
        res.status(500).json({ success: false, error: e.message });
      }
    });

    // Add or update a connection
    app.post('/api/connections', async (req, res) => {
      try {
        const { name, connectionData, testFirst } = req.body;

        if (!name || !/^[a-z0-9-]+$/.test(name)) {
          return res.status(400).json({
            error: 'Invalid name. Use lowercase letters, numbers, and hyphens only.',
          });
        }

        if (testFirst) {
          try {
            await core.testConnection(connectionData);
          } catch (e) {
            return res.status(400).json({ error: `Connection test failed: ${e.message}` });
          }
        }

        core.addConnection(name, connectionData);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // Delete a connection
    app.delete('/api/connections/:name', (req, res) => {
      try {
        core.removeConnection(req.params.name);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // Set default connection
    app.put('/api/connections/:name/default', (req, res) => {
      try {
        core.setDefault(req.params.name);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // Encryption key info (path only — no key material)
    app.get('/api/key-info', (req, res) => {
      const fs      = require('fs');
      const keyPath = path.join(__dirname, '.key');
      res.json({ keyPath, keyExists: fs.existsSync(keyPath) });
    });

    // Health check
    app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

    // Done — shut down and unblock the CLI
    app.post('/api/shutdown', (req, res) => {
      res.json({ success: true });
      console.log('\nShutting down connection manager...');
      server.close(() => {
        console.log('Done.\n');
        resolve();
      });
    });

    const PORT = process.env.POSTGRES_CLIENT_PORT || 9876;

    const server = app.listen(PORT, 'localhost', async () => {
      const url = `http://localhost:${PORT}`;
      console.log(`\n🔐 PostgreSQL Connection Manager`);
      console.log(`\n   ${url}`);
      console.log(`\n⚠️  This interface is private — the AI cannot see your credentials`);
      console.log(`   Click "Done — return to agent" in the UI when finished\n`);

      try {
        await open(url);
      } catch {
        // Fallback for WSL / headless environments
        const { exec } = require('child_process');
        for (const cmd of [
          `xdg-open "${url}"`,
          `sensible-browser "${url}"`,
          `wslview "${url}"`,
          `cmd.exe /c start "${url}"`,
        ]) {
          exec(cmd, (err) => { if (!err) console.log('Browser opened.\n'); });
          await new Promise(r => setTimeout(r, 400));
        }
      }
    });

    server.on('error', reject);

    process.on('SIGINT',  () => server.close(() => resolve()));
    process.on('SIGTERM', () => server.close(() => resolve()));
  });
}

// Allow running directly: `node launch-connection-manager.js`
if (require.main === module) {
  start().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { start };
