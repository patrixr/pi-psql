---
name: pi-psql
description: Secure PostgreSQL client with AES-256-GCM encrypted credentials. Run SQL queries, inspect schemas, list tables and views, explore indexes, and check connection health. Use when working with PostgreSQL databases. Connections are managed by humans via a browser UI — run `./cli.js open-connection-manager` as a foreground command (no &), tell the user to fill in their details and click Done, then wait for the command to return before continuing.
---

# pi-psql

A unified CLI for querying PostgreSQL databases securely. All credentials are encrypted at rest — you interact with connections by name only and never see plaintext passwords or connection strings.

## Entry Point

All commands go through the single CLI:

```bash
./cli.js <command> [options]
```

---

## Before Every Task — Check Available Connections

Run `connections` first to see what databases are configured:

```bash
./cli.js connections
```

Every command that queries a database **requires `-c <name>`**. There is no implicit default — if you omit it, the command will fail with a clear error. Use the name shown by `connections`.

```bash
./cli.js connections
# NAME        TYPE          DEFAULT
# local       parameters
# staging     parameters
# production  conn-string   ★

./cli.js query "SELECT COUNT(*) FROM orders" -c production
./cli.js tables -c staging
```

If the connection you need does not exist yet, **run the connection manager yourself and tell the user what to do**:

```bash
./cli.js open-connection-manager
```

> ⚠️ **Run this as a foreground command — do not append `&`.** `&` would background the process and cause you to continue immediately, before the user has had a chance to add anything. Without `&`, the command blocks until the user clicks "Done — return to agent", which is your signal to proceed.

When you run it, tell the user something like:
> "I've opened the connection manager in your browser. Please add the connection details there, then click **Done — return to agent** when you're finished."

Once the command returns, run `./cli.js connections` to confirm the new connection is available, then continue the task.

---

## Global Options

These flags apply to every command:

| Flag | Alias | Description |
|------|-------|-------------|
| `--connection <name>` | `-c` | **Required** on all data commands. Use the name shown by `./cli.js connections`. |
| `--format <fmt>` | `-f` | Output format: `table` (default), `json`, or `csv`. |
| `--help` | `-h` | Show help for the current command. |
| `--version` | `-v` | Print the CLI version. |

**Prefer `--format json` when you need to parse results programmatically.**

---

## Commands

### `query` — Execute a SQL statement

```bash
./cli.js query <sql>
./cli.js query --file <path>
```

| Option | Alias | Description |
|--------|-------|-------------|
| `--file <path>` | `-F` | Read SQL from a file instead of inline. |
| `--limit <n>` | | Max rows to display. Default: `500`. Warns if exceeded. |

The SQL can span multiple words without quoting for simple statements, but **always quote statements that contain shell-special characters** (`*`, `?`, `$`, `>`, etc.).

```bash
./cli.js query "SELECT * FROM users LIMIT 10" -c production

# Multi-line query
./cli.js query "
  SELECT date_trunc('day', created_at) AS day, COUNT(*) AS signups
  FROM users
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY 1
  ORDER BY 1
" -c production

# Execute a SQL file
./cli.js query --file ./migrations/001_add_index.sql -c production

# JSON output (best for parsing results)
./cli.js query "SELECT id, email FROM users LIMIT 5" -c production --format json

# Raise the row cap
./cli.js query "SELECT * FROM logs" -c production --limit 2000
```

DML and DDL responses show the command and affected row count:
```
UPDATE — 42 row(s) affected
```

---

### `tables` — List all tables

```bash
./cli.js tables [--schema <name>]
```

Lists all user tables, excluding PostgreSQL system schemas. Includes schema name, table name, and owner.

```bash
./cli.js tables -c production
./cli.js tables -c production --schema reporting
./cli.js tables -c production --format json
```

---

### `views` — List all views

```bash
./cli.js views [--schema <name>]
```

Lists all user-defined views, excluding system schemas.

```bash
./cli.js views -c production
./cli.js views -c production --schema analytics
```

---

### `describe` — Show column definitions for a table

```bash
./cli.js describe <table>
```

Outputs column name, data type, nullability, default value, and max character length. Supports `schema.table` dot notation.

```bash
./cli.js describe users -c production
./cli.js describe analytics.page_views -c production
./cli.js describe events -c production --schema tracking
./cli.js describe orders -c production --format json
```

---

### `indexes` — List indexes on a table

```bash
./cli.js indexes <table>
```

Shows all indexes defined on the given table, including their full definition. Supports `schema.table` dot notation.

```bash
./cli.js indexes users -c production
./cli.js indexes analytics.events -c production
./cli.js indexes orders -c production --format json
```

---

### `info` — Show database server information

```bash
./cli.js info
```

Returns the PostgreSQL version, current database name, connected user, server host, and port.

```bash
./cli.js info -c production
./cli.js info -c staging
./cli.js info -c production --format json
```

---

### `connections` — List configured connections

```bash
./cli.js connections
```

Lists all available connection names, their type (`parameters` or `connection-string`), and which one is the default (`★`). Credentials are never shown.

```bash
# List all connections
./cli.js connections

# JSON output
./cli.js connections --format json
```

Example output:
```
┌────────────┬──────────────────┬─────────┐
│ name       │ type             │ default │
├────────────┼──────────────────┼─────────┤
│ local      │ parameters       │         │
│ staging    │ parameters       │         │
│ production │ connection-string│ ★       │
└────────────┴──────────────────┴─────────┘
```

---

### `test` — Test a connection

```bash
./cli.js test [connection]
```

Runs a lightweight probe query to verify the connection is reachable. Reports database name, user, and server version on success.

```bash
./cli.js test production
./cli.js test staging
./cli.js test production --format json
```

---

### `open-connection-manager` — Open the web UI to manage connections

```bash
./cli.js open-connection-manager
```

**Run this yourself** whenever a connection needs to be added or changed. Do not ask the user to run it.

> ⚠️ **Run this as a foreground command — do not append `&`.** `&` backgrounds the process and you would continue immediately without waiting. Without `&`, the command blocks until the user clicks "Done — return to agent", which is how you know they are finished.

Workflow:
1. Run `./cli.js open-connection-manager` — the browser opens automatically
2. Tell the user: *"I've opened the connection manager. Please add your connection details and click Done — return to agent when finished."*
3. Wait — the command will unblock once the user clicks Done
4. Run `./cli.js connections` to confirm the connection is now available
5. Continue the original task

```bash
./cli.js open-connection-manager
# ... user fills in details and clicks Done ...
./cli.js connections   # verify it's there
./cli.js test <name>   # confirm it works
```

---

## Output Formats

| Format | Best for |
|--------|----------|
| `table` | Human-readable terminal output (default) |
| `json`  | Parsing results, piping to `jq`, programmatic use |
| `csv`   | Exporting data, spreadsheets |

```bash
# Pipe JSON results to jq
./cli.js query "SELECT * FROM users LIMIT 3" --format json | jq '.[].email'

# Export a table to CSV
./cli.js query "SELECT * FROM products" --format csv > products.csv
```

---

## Typical Workflows

```bash
# 1. See what connections exist
./cli.js connections

# 2. Verify the target is reachable
./cli.js test production

# 3. Get your bearings
./cli.js info -c production
./cli.js tables -c production

# 4. Explore a specific table
./cli.js describe users -c production
./cli.js indexes users -c production

# 5. Run a query
./cli.js query "SELECT COUNT(*) FROM orders WHERE status = 'pending'" -c production

# 6. Machine-readable output
./cli.js query "SELECT id, email FROM users LIMIT 5" -c production --format json
```

---

## Limitations

- **You cannot add or modify connections directly** — run `./cli.js open-connection-manager` as a foreground command (no `&`) and guide the user through it.
- **Never background `open-connection-manager` with `&`** — it must block so you wait for the user to finish.
- You cannot see plaintext credentials or connection strings.
- Only PostgreSQL databases are supported.
