#!/usr/bin/env node

const readline = require('readline');
const core = require('./core');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function questionHidden(prompt) {
  return new Promise(resolve => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    
    process.stdout.write(prompt);
    
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let input = '';
    
    const onData = (char) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(wasRaw);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          process.exit(0);
          break;
        case '\u007f': // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          if (char >= ' ' && char <= '~') {
            input += char;
            process.stdout.write('*');
          }
      }
    };
    
    stdin.on('data', onData);
  });
}

async function addConnection() {
  console.log('\n📝 Add New Connection\n');
  
  const name = await question('Connection name: ');
  
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    console.log('❌ Invalid name. Use lowercase letters, numbers, and hyphens only.');
    return;
  }
  
  console.log('\nChoose method:');
  console.log('  1. Connection string');
  console.log('  2. Individual parameters');
  const method = await question('Method (1 or 2): ');
  
  let connectionData;
  
  if (method === '1') {
    const connectionString = await questionHidden('Connection string: ');
    const ssl = await question('Use SSL? (y/N): ');
    
    connectionData = {
      connectionString,
      ssl: ssl.toLowerCase() === 'y'
    };
  } else {
    const host = await question('Host (localhost): ') || 'localhost';
    const port = await question('Port (5432): ') || '5432';
    const database = await question('Database: ');
    const user = await question('User (postgres): ') || 'postgres';
    const password = await questionHidden('Password: ');
    const ssl = await question('Use SSL? (y/N): ');
    
    connectionData = {
      host,
      port: parseInt(port),
      database,
      user,
      password,
      ssl: ssl.toLowerCase() === 'y'
    };
  }
  
  // Test connection
  console.log('\n🔌 Testing connection...');
  try {
    const result = await core.testConnection(connectionData);
    console.log('✅ Connection successful!');
    console.log(`   Database: ${result.database}`);
    console.log(`   User: ${result.user}`);
    console.log(`   Version: ${result.version.split('\n')[0]}\n`);
    
    const save = await question('Save this connection? (Y/n): ');
    if (save.toLowerCase() !== 'n') {
      core.addConnection(name, connectionData);
      console.log(`✅ Connection '${name}' saved!\n`);
    }
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}\n`);
  }
}

async function testExisting() {
  const list = core.listConnections();
  
  if (list.connections.length === 0) {
    console.log('No connections configured. Use "add" to create one.\n');
    return;
  }
  
  console.log('\n🔌 Test Connection\n');
  console.log('Available connections:');
  list.connections.forEach(c => {
    console.log(`  - ${c.name}${c.isDefault ? ' (default)' : ''}`);
  });
  
  const name = await question('\nConnection name: ');
  
  try {
    const connection = core.getConnection(name);
    console.log('\n🔌 Testing connection...');
    const result = await core.testConnection(connection);
    
    console.log('✅ Connection successful!');
    console.log(`   Database: ${result.database}`);
    console.log(`   User: ${result.user}`);
    console.log(`   Version: ${result.version.split('\n')[0]}\n`);
  } catch (error) {
    console.log(`❌ ${error.message}\n`);
  }
}

function listConnections() {
  const list = core.listConnections();
  
  if (list.connections.length === 0) {
    console.log('\nNo connections configured.\n');
    return;
  }
  
  console.log('\n📋 Configured Connections\n');
  console.log(`Default: ${list.default || 'none'}\n`);
  
  list.connections.forEach(c => {
    const marker = c.isDefault ? ' ⭐' : '';
    console.log(`${c.name}${marker}`);
    console.log(`  Type: ${c.type}`);
  });
  console.log();
}

async function removeConnection() {
  const list = core.listConnections();
  
  if (list.connections.length === 0) {
    console.log('No connections configured.\n');
    return;
  }
  
  console.log('\n🗑️  Remove Connection\n');
  console.log('Available connections:');
  list.connections.forEach(c => {
    console.log(`  - ${c.name}${c.isDefault ? ' (default)' : ''}`);
  });
  
  const name = await question('\nConnection name to remove: ');
  const confirm = await question(`Remove '${name}'? (y/N): `);
  
  if (confirm.toLowerCase() === 'y') {
    try {
      core.removeConnection(name);
      console.log(`✅ Connection '${name}' removed.\n`);
    } catch (error) {
      console.log(`❌ ${error.message}\n`);
    }
  }
}

async function setDefault() {
  const list = core.listConnections();
  
  if (list.connections.length === 0) {
    console.log('No connections configured.\n');
    return;
  }
  
  console.log('\n⭐ Set Default Connection\n');
  console.log('Available connections:');
  list.connections.forEach(c => {
    console.log(`  - ${c.name}${c.isDefault ? ' (current default)' : ''}`);
  });
  
  const name = await question('\nConnection name: ');
  
  try {
    core.setDefault(name);
    console.log(`✅ Default connection set to '${name}'.\n`);
  } catch (error) {
    console.log(`❌ ${error.message}\n`);
  }
}

function showHelp() {
  console.log(`
🔐 PostgreSQL Connection Manager

Usage:
  node cli.js <command>

Commands:
  add       Add a new connection (interactive)
  test      Test an existing connection
  list      List all connections
  remove    Remove a connection
  default   Set default connection
  key       Show encryption key location
  help      Show this help

Examples:
  node cli.js add       # Add new connection interactively
  node cli.js test      # Test a connection
  node cli.js list      # List all connections
  
Security:
  - All connections are encrypted at rest
  - Encryption key is stored in ~/.config/postgres-client/key
  - Or set POSTGRES_CLIENT_KEY environment variable
  - The AI agent can only use existing connections by name
  - Credentials are never exposed to the AI
`);
}

function showKeyInfo() {
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  
  const keyPath = path.join(os.homedir(), '.config', 'postgres-client', 'key');
  
  console.log('\n🔑 Encryption Key Information\n');
  
  if (process.env.POSTGRES_CLIENT_KEY) {
    console.log('Source: POSTGRES_CLIENT_KEY environment variable');
  } else if (fs.existsSync(keyPath)) {
    console.log(`Source: ${keyPath}`);
    console.log('\n⚠️  Keep this file secure - it\'s needed to decrypt your connections');
  } else {
    console.log('No key found. One will be generated on first use.');
  }
  console.log();
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'add':
        await addConnection();
        break;
      case 'test':
        await testExisting();
        break;
      case 'list':
        listConnections();
        break;
      case 'remove':
        await removeConnection();
        break;
      case 'default':
        await setDefault();
        break;
      case 'key':
        showKeyInfo();
        break;
      case 'help':
      case undefined:
        showHelp();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
