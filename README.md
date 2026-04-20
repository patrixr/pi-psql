# pi-psql

A secure PostgreSQL client skill for [pi coding agent](https://pi.dev). Query databases with AES-256-GCM encrypted credentials that the AI never sees.

## Features

- 🔐 **Secure**: Credentials encrypted at rest with auto-generated key
- 🤖 **AI-Safe**: Agent can query but never see passwords
- 🌐 **Easy Setup**: Web UI for managing connections
- 🔍 **Full-Featured**: Query execution, schema inspection, table exploration
- 📦 **Portable**: Everything self-contained in skill directory

## Installation

### Global (recommended)

```bash
pi install git:github.com/patrixr/pi-psql
```

Or install manually:

```bash
cd ~/.pi/agent/skills
git clone git@github.com:patrixr/pi-psql.git
cd pi-psql
npm install
```

### Project-local

```bash
cd .pi/skills
git clone git@github.com:patrixr/pi-psql.git
cd pi-psql
npm install
```

## Setup

### 1. Launch the connection manager

```bash
cd ~/.pi/agent/skills/pi-psql
./launch-connection-manager.js
```

This opens a web interface where you can:
- Add database connections
- Test connections before saving
- Set a default connection
- Manage existing connections

**Security:** The web server runs locally (localhost:9876). All data stays on your machine. The AI can never see your browser interactions.

### 2. Add a connection

In the web UI:
1. Click "Add Connection"
2. Fill in connection details (host, port, database, username, password)
3. Optionally configure SSL mode
4. Test the connection
5. Save

Your credentials are immediately encrypted and stored in `connections.enc`.

### 3. Use with AI

Once connections are set up, tell the AI to use them:

> "Query the production database and show me the top 10 users by order count"

The AI will use the skill automatically.

## How It Works

### For Humans

You manage connections through a web UI:
- Web interface runs on `localhost:9876`
- Add, test, and delete connections
- All credentials encrypted before storage
- Encryption key auto-generated on first use

### For AI Agents

The AI can only:
- ✅ List available connections
- ✅ Execute SQL queries
- ✅ Inspect schemas and tables
- ❌ Cannot see passwords or connection strings
- ❌ Cannot create/modify connections
- ❌ Cannot access encryption key

## Usage

### AI Commands

The AI agent uses `execute-query.js`:

```bash
# List connections
./execute-query.js --list

# Query default database
./execute-query.js "SELECT * FROM users LIMIT 5"

# Query specific connection
./execute-query.js --connection analytics "SELECT COUNT(*) FROM events"

# Database info
./execute-query.js --info
./execute-query.js --tables
./execute-query.js --describe users
```

### Manual Connection Management

Humans use `launch-connection-manager.js`:

```bash
./launch-connection-manager.js
# Opens web UI at http://localhost:9876
```

## Security

### Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key**: Auto-generated 256-bit key stored in `.key`
- **Storage**: Encrypted credentials in `connections.enc`

### What's Protected

- Database passwords (encrypted)
- Connection strings (encrypted)
- Encryption key (file-based, excluded from git)

### What the AI Cannot Do

- Read `.key` file (would need file system access outside skill scope)
- Decrypt `connections.enc` (needs the key)
- See your browser interactions (web UI traffic is local)

### Backup Your Key

To backup your encryption key:

```bash
cat ~/.pi/agent/skills/pi-psql/.key
```

**Important:** If you lose the `.key` file, you'll lose access to your encrypted connections.

## Examples

### Basic Query

```bash
./execute-query.js "SELECT version()"
```

### Specific Connection

```bash
./execute-query.js --connection production "
  SELECT 
    date_trunc('day', created_at) as day,
    COUNT(*) as orders
  FROM orders
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY day
  ORDER BY day DESC
"
```

### Schema Exploration

```bash
# List all tables
./execute-query.js --tables

# Describe a table
./execute-query.js --describe orders

# Get database info
./execute-query.js --info
```

## Development

### Project Structure

```
pi-psql/
├── SKILL.md                      # Agent instructions
├── README.md                     # Human documentation (this file)
├── execute-query.js              # AI interface
├── launch-connection-manager.js  # Web UI server
├── core/                         # Shared libraries
│   ├── crypto.js                 # Encryption
│   ├── storage.js                # Connection storage
│   ├── database.js               # Query execution
│   └── index.js                  # Exports
├── public/                       # Web UI assets
│   ├── index.html
│   └── app.js
├── .key                          # Encryption key (gitignored)
├── connections.enc               # Encrypted connections (gitignored)
└── package.json
```

### Publishing to npm

1. Remove `"private": true` from `package.json`
2. Add npm metadata (repository, keywords, etc.)
3. `npm publish`

## Troubleshooting

### "Connection not found"

The connection name doesn't exist. Run:
```bash
./execute-query.js --list
```

If empty, launch the connection manager and add a connection:
```bash
./launch-connection-manager.js
```

### "Cannot read .key file"

The encryption key is missing. On first use, it auto-generates. If you deleted it and have encrypted connections, you'll need to re-add them.

### Web UI won't open

Check if port 9876 is already in use:
```bash
lsof -i :9876
```

Kill the process or edit `launch-connection-manager.js` to use a different port.

## License

MIT

## Contributing

Issues and PRs welcome at https://github.com/patrixr/pi-psql
