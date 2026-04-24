# pi-psql

[![npm version](https://badge.fury.io/js/pi-psql.svg)](https://www.npmjs.com/package/pi-psql)
[![Release](https://github.com/patrixr/pi-psql/actions/workflows/release.yml/badge.svg)](https://github.com/patrixr/pi-psql/actions/workflows/release.yml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

A secure PostgreSQL client skill for [pi coding agent](https://pi.dev). Query databases with AES-256-GCM encrypted credentials that the AI never sees.

## Features

- 🔐 **Secure** — Credentials encrypted at rest with AES-256-GCM
- 🤖 **AI-Safe** — Agent can query but never see passwords or connection strings
- 🖥️ **Unified CLI** — All commands through a single `pi-psql` entry point
- 🌐 **Easy Setup** — TUI-styled web UI for managing connections
- 🔍 **Full Introspection** — Query, schema inspection, tables, views, indexes

## Installation

### Global (recommended)

```bash
pi install git:github.com/patrixr/pi-psql
```

Or manually:

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

### 1. Open the connection manager

```bash
./cli.js open-connection-manager
```

This opens a local web UI where you can add, test, and manage connections. The command **blocks** until you click **Done — return to agent**, making it safe to use from within an AI session.

**Security:** The web server runs on `localhost:9876`. All data stays on your machine. The AI cannot observe your browser interactions.

### 2. Add a connection

In the web UI:
1. Click **[A] Add Connection**
2. Fill in connection details or paste a connection string
3. Choose SSL mode if needed
4. Optionally test before saving
5. Click Save

Credentials are immediately encrypted and stored in `connections.enc`.

### 3. Use with the AI

Once connections are configured, the AI uses them automatically via `cli.js`.

## CLI Reference

All commands go through the unified CLI:

```
./cli.js <command> [options]
```

### Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--connection <name>` | `-c` | Connection to use (defaults to the configured default) |
| `--format <fmt>` | `-f` | Output format: `table` (default), `json`, `csv` |

### Commands

| Command | Description |
|---------|-------------|
| `query [sql]` | Execute a SQL statement |
| `tables` | List all tables |
| `views` | List all views |
| `describe <table>` | Show column definitions for a table |
| `indexes <table>` | List indexes on a table |
| `info` | Show database server info |
| `connections` | List configured connections |
| `test [connection]` | Test a connection |
| `open-connection-manager` | Open the web UI to add/edit/remove connections |

Run `./cli.js --help` or `./cli.js <command> --help` for full usage.

### Examples

```bash
# See what's available
./cli.js connections
./cli.js info

# Run queries
./cli.js query "SELECT * FROM users LIMIT 10"
./cli.js query --file ./report.sql
./cli.js query "SELECT COUNT(*) FROM orders" --connection production

# Explore the schema
./cli.js tables
./cli.js views --schema reporting
./cli.js describe users
./cli.js describe analytics.events   # schema.table notation
./cli.js indexes orders

# Machine-readable output
./cli.js query "SELECT id, email FROM users" --format json | jq '.[].email'
./cli.js tables --format csv > tables.csv

# Test a connection
./cli.js test production

# Manage connections
./cli.js open-connection-manager
```

## Security Model

### Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key**: Auto-generated 256-bit key stored in `.key`
- **Storage**: Encrypted credentials in `connections.enc`

### What the AI Can Do

- ✅ List connection names
- ✅ Execute SQL queries
- ✅ Inspect schemas, tables, views, indexes
- ✅ Test connections

### What the AI Cannot Do

- ❌ See passwords or connection strings
- ❌ Create or modify connections (only the human via web UI)
- ❌ Access the encryption key

### Backup Your Key

```bash
cat ~/.pi/agent/skills/pi-psql/.key
```

> **Important:** If you lose `.key`, you lose access to your encrypted connections. Back it up securely.

## Project Structure

```
pi-psql/
├── SKILL.md                      # Agent-facing instructions (read by AI)
├── README.md                     # Human documentation (this file)
├── cli.js                        # Unified CLI entry point
├── launch-connection-manager.js  # Web UI server
├── core/
│   ├── crypto.js                 # AES-256-GCM encryption
│   ├── storage.js                # Connection storage
│   ├── database.js               # Query execution & introspection
│   └── index.js                  # Exports
├── public/                       # Connection manager web UI
│   ├── index.html
│   └── app.js
├── .key                          # Encryption key (gitignored)
├── connections.enc               # Encrypted connections (gitignored)
└── package.json
```

## Troubleshooting

### "Connection not found"

Run `./cli.js connections` to see what's available. If empty, open the connection manager:

```bash
./cli.js open-connection-manager
```

### Port already in use

```bash
lsof -i :9876
```

Kill the process or set a different port with `POSTGRES_CLIENT_PORT=9877 ./cli.js open-connection-manager`.

### Lost encryption key

If `.key` is missing and `connections.enc` exists, you'll need to re-add all connections. Delete `connections.enc` and run `open-connection-manager` to start fresh.

## Publishing

This package uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning. Push conventional commits to `main` and releases are handled automatically.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [.github/PUBLISHING.md](.github/PUBLISHING.md) for details.

## Contributing

Issues and PRs welcome at https://github.com/patrixr/pi-psql

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) and use [conventional commits](https://www.conventionalcommits.org/).

## License

MIT
