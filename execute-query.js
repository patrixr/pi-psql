#!/usr/bin/env node

const core = require('./core');

async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.length === 0 || args[0] === '--help') {
      console.log('Usage:');
      console.log('  execute-query.js "SQL QUERY"');
      console.log('  execute-query.js --connection <name> "SQL QUERY"');
      console.log('  execute-query.js --list              # List connections');
      console.log('  execute-query.js --info              # Database info');
      console.log('  execute-query.js --tables            # List all tables');
      console.log('  execute-query.js --describe <table>  # Describe table schema');
      console.log('  execute-query.js --ui                # Launch connection manager (manual use)');
      console.log('\nNote: Use launch-connection-manager.js to add/modify connections');
      process.exit(0);
    }
    
    // Launch web UI
    if (args[0] === '--ui') {
      const { spawn } = require('child_process');
      const path = require('path');
      const serverPath = path.join(__dirname, 'server.js');
      
      console.log('🚀 Launching web UI...');
      console.log('   The web interface will open in your browser');
      console.log('   All interactions with the UI are private from the AI\n');
      
      const server = spawn('node', [serverPath], {
        detached: false,
        stdio: 'inherit'
      });
      
      // Keep process alive
      process.on('SIGINT', () => {
        server.kill();
        process.exit(0);
      });
      
      return;
    }
    
    // List connections (safe - no credentials)
    if (args[0] === '--list') {
      const list = core.listConnections();
      
      if (list.connections.length === 0) {
        console.log('\nNo connections configured. Use "node cli.js add" to create one.\n');
        process.exit(0);
      }
      
      console.log('\n📋 Available Connections\n');
      console.log(`Default: ${list.default || 'none'}\n`);
      
      list.connections.forEach(c => {
        const marker = c.isDefault ? ' ⭐' : '';
        console.log(`${c.name}${marker}`);
        console.log(`  Type: ${c.type}`);
      });
      console.log();
      process.exit(0);
    }
    
    // Parse connection flag
    let connectionName = null;
    let commandArgs = args;
    
    if (args[0] === '--connection') {
      connectionName = args[1];
      commandArgs = args.slice(2);
    }
    
    // Get connection (decrypts internally)
    const connection = core.getConnection(connectionName);
    console.log(`\n🔌 Using connection: ${connection.name}`);
    
    let result;
    
    if (commandArgs[0] === '--info') {
      const info = await core.getDatabaseInfo(connection);
      console.log('\n=== Database Information ===');
      console.log(JSON.stringify(info, null, 2));
      
    } else if (commandArgs[0] === '--tables') {
      const tables = await core.listTables(connection);
      console.log('\n=== Tables ===');
      console.table(tables);
      
    } else if (commandArgs[0] === '--describe' && commandArgs[1]) {
      const schema = await core.describeTable(connection, commandArgs[1]);
      console.log(`\n=== Table: ${commandArgs[1]} ===`);
      console.table(schema);
      
    } else {
      const query = commandArgs.join(' ');
      result = await core.executeQuery(connection, query);
      
      console.log(`\n=== Query Results ===`);
      console.log(`Rows returned: ${result.rowCount || 0}`);
      
      if (result.rows && result.rows.length > 0) {
        console.table(result.rows);
      } else if (result.command) {
        console.log(`Command: ${result.command}`);
        console.log(`Rows affected: ${result.rowCount}`);
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('not found')) {
      console.error('\nUse "node query.js --list" to see available connections');
      console.error('Or create one with "node cli.js add"\n');
    }
    
    process.exit(1);
  }
}

main();
