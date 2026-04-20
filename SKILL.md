---
name: pi-psql
description: Secure PostgreSQL client with encrypted credentials. Execute SQL queries, inspect schemas, list tables, and explore database structure. Use when working with PostgreSQL databases. Credentials are managed separately by humans via web UI.
---

# PostgreSQL Client

A secure PostgreSQL client skill with AES-256-GCM encrypted credentials. Query databases without ever exposing passwords or connection strings.

## How It Works

**Security Model:**
- Humans manage connections via web UI (`launch-connection-manager.js`)
- Credentials encrypted at rest with auto-generated key
- You can only use existing connections by name
- You cannot create, modify, or see plaintext credentials

## Available Commands

### List Connections

See what databases are available:
```bash
./execute-query.js --list
```

### Execute Query

Run SQL on the default connection:
```bash
./execute-query.js "SELECT * FROM users LIMIT 10"
```

Run SQL on a specific connection:
```bash
./execute-query.js --connection production "SELECT COUNT(*) FROM orders"
```

### Database Information

Get current database info:
```bash
./execute-query.js --info
```

List all tables:
```bash
./execute-query.js --tables
```

Describe a table schema:
```bash
./execute-query.js --describe users
```

## Examples

```bash
# Check what connections are available
./execute-query.js --list

# Query the default database
./execute-query.js "SELECT version()"

# Use a specific connection
./execute-query.js --connection analytics "
  SELECT date, COUNT(*) as orders 
  FROM orders 
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY date
"

# Explore the schema
./execute-query.js --tables
./execute-query.js --describe products

# Get database stats
./execute-query.js --info
```

## Limitations

- Read-only interface - you cannot add/modify connections
- Cannot see connection strings or passwords
- Cannot access the encryption key
- If a connection doesn't exist, ask the user to add it via the web UI

## When to Use This Skill

Use this skill when you need to:
- Query PostgreSQL databases
- Inspect database schemas
- Analyze data with SQL
- Check table structures
- Explore database contents

Do NOT use this skill for:
- Adding new database connections (user must do this manually)
- Modifying credentials
- Non-PostgreSQL databases
