#!/usr/bin/env node
'use strict';

const yargs    = require('yargs');
const { hideBin } = require('yargs/helpers');
const core     = require('./core');

// ── Output helpers ───────────────────────────────────────────────────────────

const MAX_COL_WIDTH = 60;

function truncate(str, max) {
  const s = String(str ?? '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function printTable(rows) {
  if (!rows || rows.length === 0) {
    console.log('(0 rows)');
    return;
  }

  const keys   = Object.keys(rows[0]);
  const widths = keys.map(k =>
    Math.min(MAX_COL_WIDTH, Math.max(k.length, ...rows.map(r => String(r[k] ?? '').length)))
  );

  const top  = '┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
  const mid  = '├' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
  const bot  = '└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';
  const head = '│ ' + keys.map((k, i) => k.padEnd(widths[i])).join(' │ ') + ' │';
  const row  = (r) =>
    '│ ' + keys.map((k, i) => truncate(r[k], widths[i]).padEnd(widths[i])).join(' │ ') + ' │';

  console.log(top);
  console.log(head);
  console.log(mid);
  rows.forEach(r => console.log(row(r)));
  console.log(bot);
  console.log(`(${rows.length} row${rows.length !== 1 ? 's' : ''})`);
}

function printCsv(rows) {
  if (!rows || rows.length === 0) return;
  const keys   = Object.keys(rows[0]);
  const escape = v => {
    const s = String(v ?? '');
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  console.log(keys.join(','));
  rows.forEach(r => console.log(keys.map(k => escape(r[k])).join(',')));
}

function printOutput(rows, format) {
  switch (format) {
    case 'json': console.log(JSON.stringify(rows, null, 2)); break;
    case 'csv':  printCsv(rows); break;
    default:     printTable(rows); break;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getConn(argv) {
  return core.getConnection(argv.connection || null);
}

function die(err) {
  process.stderr.write(`\nError: ${err.message || err}\n\n`);
  process.exit(1);
}

// Parse "schema.table" or return schema from --schema flag
function resolveTable(rawTable, fallbackSchema) {
  if (rawTable.includes('.')) {
    const [schema, table] = rawTable.split('.', 2);
    return { schema, table };
  }
  return { schema: fallbackSchema || 'public', table: rawTable };
}

// ── CLI ────────────────────────────────────────────────────────────────────────

yargs(hideBin(process.argv))
  .scriptName('pi-psql')
  .usage('Usage: $0 <command> [options]')

  // ── Global options ─────────────────────────────────────────────────────────
  .option('connection', {
    alias:       'c',
    type:        'string',
    description: 'Connection name to use',
    global:      true,
  })
  .option('format', {
    alias:       'f',
    type:        'string',
    description: 'Output format',
    choices:     ['table', 'json', 'csv'],
    default:     'table',
    global:      true,
  })

  // ── query ──────────────────────────────────────────────────────────────────
  .command(
    'query [sql..]',
    'Execute a SQL statement',
    (y) => y
      .positional('sql', {
        type:        'string',
        array:       true,
        description: 'SQL to execute (quote the whole statement or use --file)',
      })
      .option('file', {
        alias:       'F',
        type:        'string',
        description: 'Path to a .sql file to execute',
      })
      .option('limit', {
        type:        'number',
        description: 'Maximum rows to display (warns if exceeded)',
        default:     500,
      })
      .example([
        ['$0 query "SELECT * FROM users LIMIT 10" -c mydb', 'Inline SQL'],
        ['$0 query --file ./report.sql -c mydb',             'From file'],
        ['$0 query "SELECT 1" -c mydb --format json',        'JSON output'],
      ])
      .demandOption('connection', 'Specify a connection with -c <name>. Run `./cli.js connections` to list available connections.'),
    async (argv) => {
      try {
        let sql = argv.sql?.length ? argv.sql.join(' ') : null;

        if (!sql && argv.file) {
          const fs = require('fs');
          if (!fs.existsSync(argv.file)) return die(new Error(`File not found: ${argv.file}`));
          sql = fs.readFileSync(argv.file, 'utf8');
        }

        if (!sql?.trim()) return die(new Error('Provide a SQL query or use --file <path>'));

        const conn   = getConn(argv);
        process.stderr.write(`Using connection: ${conn.name}\n`);

        const result = await core.executeQuery(conn, sql);

        if (result.rows?.length > 0) {
          const limited   = result.rows.length > argv.limit;
          const displayed = limited ? result.rows.slice(0, argv.limit) : result.rows;
          printOutput(displayed, argv.format);
          if (limited) {
            process.stderr.write(
              `\nWarning: output truncated to ${argv.limit} rows ` +
              `(${result.rows.length} total). Use --limit <n> to adjust.\n`
            );
          }
        } else {
          const summary = { command: result.command ?? 'OK', rowCount: result.rowCount ?? 0 };
          if (argv.format === 'json') {
            console.log(JSON.stringify(summary));
          } else {
            console.log(`\n${summary.command} — ${summary.rowCount} row(s) affected\n`);
          }
        }
      } catch (e) { die(e); }
    }
  )

  // ── tables ─────────────────────────────────────────────────────────────────
  .command(
    'tables',
    'List all tables in the database',
    (y) => y
      .option('schema', {
        alias:       's',
        type:        'string',
        description: 'Filter by a specific schema (shows all non-system schemas by default)',
      })
      .example([
        ['$0 tables -c mydb',                  'All user tables'],
        ['$0 tables -c mydb --schema public',  'Tables in a specific schema'],
        ['$0 tables -c mydb --format json',    'JSON output'],
      ])
      .demandOption('connection', 'Specify a connection with -c <name>. Run `./cli.js connections` to see available connections.'),
    async (argv) => {
      try {
        const conn = getConn(argv);
        const rows = await core.listTables(conn, argv.schema);
        printOutput(rows, argv.format);
      } catch (e) { die(e); }
    }
  )

  // ── views ──────────────────────────────────────────────────────────────────
  .command(
    'views',
    'List all views in the database',
    (y) => y
      .option('schema', {
        alias:       's',
        type:        'string',
        description: 'Filter by a specific schema (shows all non-system schemas by default)',
      })
      .example([
        ['$0 views -c mydb',                       'All user views'],
        ['$0 views -c mydb --schema reporting',    'Views in a specific schema'],
      ])
      .demandOption('connection', 'Specify a connection with -c <name>. Run `./cli.js connections` to see available connections.'),
    async (argv) => {
      try {
        const conn = getConn(argv);
        const rows = await core.listViews(conn, argv.schema);
        printOutput(rows, argv.format);
      } catch (e) { die(e); }
    }
  )

  // ── describe ───────────────────────────────────────────────────────────────
  .command(
    'describe <table>',
    'Show column definitions for a table',
    (y) => y
      .positional('table', {
        type:        'string',
        description: 'Table name — supports schema.table notation',
      })
      .option('schema', {
        alias:       's',
        type:        'string',
        description: 'Schema name (overridden by schema.table dot notation)',
        default:     'public',
      })
      .example([
        ['$0 describe users -c mydb',              'Describe a table in public schema'],
        ['$0 describe analytics.events -c mydb',   'Describe a table in a specific schema'],
      ])
      .demandOption('connection', 'Specify a connection with -c <name>. Run `./cli.js connections` to see available connections.'),
    async (argv) => {
      try {
        const conn              = getConn(argv);
        const { schema, table } = resolveTable(argv.table, argv.schema);
        const rows              = await core.describeTable(conn, table, schema);
        printOutput(rows, argv.format);
      } catch (e) { die(e); }
    }
  )

  // ── indexes ────────────────────────────────────────────────────────────────
  .command(
    'indexes <table>',
    'List indexes on a table',
    (y) => y
      .positional('table', {
        type:        'string',
        description: 'Table name — supports schema.table notation',
      })
      .option('schema', {
        alias:       's',
        type:        'string',
        description: 'Schema name (overridden by schema.table dot notation)',
        default:     'public',
      })
      .example([
        ['$0 indexes users -c mydb',             'Indexes on public.users'],
        ['$0 indexes analytics.events -c mydb',  'Indexes on a schema-qualified table'],
      ])
      .demandOption('connection', 'Specify a connection with -c <name>. Run `./cli.js connections` to see available connections.'),
    async (argv) => {
      try {
        const conn              = getConn(argv);
        const { schema, table } = resolveTable(argv.table, argv.schema);
        const rows              = await core.listIndexes(conn, table, schema);
        printOutput(rows, argv.format);
      } catch (e) { die(e); }
    }
  )

  // ── info ───────────────────────────────────────────────────────────────────
  .command(
    'info',
    'Show information about the connected database server',
    (y) => y
      .example([
        ['$0 info -c production',         'Info for a specific connection'],
        ['$0 info -c staging --format json', 'JSON output'],
      ])
      .demandOption('connection', 'Specify a connection with -c <name>. Run `./cli.js connections` to see available connections.'),
    async (argv) => {
      try {
        const conn = getConn(argv);
        const info = await core.getDatabaseInfo(conn);
        printOutput([info], argv.format);
      } catch (e) { die(e); }
    }
  )

  // ── connections ────────────────────────────────────────────────────────────
  .command(
    'connections',
    'List all configured connections',
    (y) => y.example([
      ['$0 connections',             'List all connections'],
      ['$0 connections --format json', 'JSON output'],
    ]),
    async (argv) => {
      try {
        const list = core.listConnections();
        const rows = list.connections.map(c => ({
          name:    c.name,
          type:    c.type,
          default: c.isDefault ? '★' : '',
        }));
        printOutput(rows, argv.format);
      } catch (e) { die(e); }
    }
  )

  // ── test ───────────────────────────────────────────────────────────────────
  .command(
    'test <connection>',
    'Test a connection by running a lightweight probe query',
    (y) => y
      .positional('connection', {
        type:        'string',
        description: 'Connection name to test',
      })
      .example([
        ['$0 test production',  'Test the production connection'],
        ['$0 test staging',     'Test the staging connection'],
      ]),
    async (argv) => {
      try {
        const conn = core.getConnection(argv.connection);
        process.stderr.write(`Testing connection: ${conn.name} ...\n`);
        const result = await core.testConnection(conn);

        if (argv.format === 'json') {
          console.log(JSON.stringify({ connection: conn.name, ...result }));
        } else {
          console.log(`\n✓ Connected successfully`);
          console.log(`  Connection : ${conn.name}`);
          console.log(`  Database   : ${result.database}`);
          console.log(`  User       : ${result.user}`);
          console.log(`  Version    : ${result.version}\n`);
        }
      } catch (e) { die(e); }
    }
  )

  // ── open-connection-manager ───────────────────────────────────────────────
  .command(
    'open-connection-manager',
    'Open the connection manager web UI to add, edit, or remove connections',
    (y) => y.example([['$0 open-connection-manager', 'Open connection manager in browser']]),
    async () => {
      const { start } = require('./core/connection-manager');
      await start();
    }
  )

  .demandCommand(1, 'Please specify a command. Run with --help to see available commands.')
  .recommendCommands()
  .strict()
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .wrap(Math.min(100, process.stdout.columns || 100))
  .epilogue('Tip: append --format json for machine-readable output (useful with jq)')
  .argv;
