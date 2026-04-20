---
name: pi-psql
description: Connect to and query PostgreSQL databases. Execute SQL queries, inspect schemas, and manage database operations. Use when working with PostgreSQL databases.
---

# pi-psql

A secure skill for connecting to and querying PostgreSQL databases. All credentials are encrypted at rest and managed via a web UI or CLI.

## Setup

### 1. Install dependencies (run once):
```bash
cd ~/.pi/agent/skills/pi-psql && npm install
```

### Manage connections (DO THIS MANUALLY - AI cannot see this):

**Web UI (Recommended)**
```bash
cd ~/.pi/agent/skills/pi-psql && node query.js --ui
```

This will:
- Open a web interface in your browser
- All interactions are private - the AI cannot see the web traffic
- Add, test, and manage connections visually
- Your credentials never leave your machine

## Web UI (For You - Manual Use)

Launch the web interface:
```bash
node query.js --ui
```

Features:
- 🔐 Add connections with visual forms
- ✅ Test connections before saving
- 🎯 Set default connection
- 🗑️ Delete connections
- 📊 View encryption key info
- 🎨 Modern, user-friendly interface

**Security:** The web server runs locally (localhost:9876). All data stays on your machine. The AI agent can start the server but cannot see your browser interactions or form submissions.

## Query Interface (For AI Agent)

The AI can only use existing connections by name. It cannot create, modify, or see your credentials.

```bash
# List available connections (names only)
node query.js --list

# Use default connection
node query.js "SELECT * FROM users LIMIT 5"

# Use specific connection
node query.js --connection production "SELECT COUNT(*) FROM users"

# Get database info
node query.js --info

# List all tables
node query.js --tables

# Describe table schema
node query.js --describe tablename
```

## Security

- ✅ All credentials encrypted with AES-256-GCM
- ✅ Encryption key auto-generated on first use and stored in `.key` (within skill directory)
- ✅ Connection file (`connections.enc`) is gitignored
- ✅ AI can only use existing connections, cannot create/modify
- ✅ AI never sees plaintext credentials
- ✅ Passwords never displayed in output

### Encryption Key

The encryption key is auto-generated on first use and stored in `.key` within the skill directory.

To backup your key:
```bash
cat ~/.pi/agent/skills/pi-psql/.key
```

**Important:** If you lose the `.key` file, you'll lose access to your encrypted connections.

## Examples

```bash
# You create a connection manually via web UI:
node query.js --ui
# Enter: name=local, host=localhost, database=mydb, etc.

# AI can use it by name:
node query.js --connection local "SELECT * FROM users"

# Or use default:
node query.js "SELECT COUNT(*) FROM orders"
```

## Migration from connections.json

If you have an existing `connections.json`, you'll need to re-add connections using the web UI:

```bash
node query.js --ui
# Add the same connection details through the web interface
```

The old `connections.json` file is no longer used.
