const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Get or create encryption key
 * Priority: 
 * 1. POSTGRES_CLIENT_KEY env var
 * 2. Key file in skill directory (.key)
 * 3. Auto-generate and save to skill directory (.key)
 */
function getEncryptionKey() {
  // Try environment variable first
  if (process.env.POSTGRES_CLIENT_KEY) {
    const key = Buffer.from(process.env.POSTGRES_CLIENT_KEY, 'hex');
    if (key.length === KEY_LENGTH) {
      return key;
    }
    throw new Error('POSTGRES_CLIENT_KEY must be 32 bytes (64 hex characters)');
  }
  
  // Store key in skill directory
  const skillDir = path.join(__dirname, '..');
  const keyPath = path.join(skillDir, '.key');
  
  if (fs.existsSync(keyPath)) {
    const key = Buffer.from(fs.readFileSync(keyPath, 'utf8').trim(), 'hex');
    if (key.length === KEY_LENGTH) {
      return key;
    }
  }
  
  // Auto-generate and save
  console.log('🔑 First run detected - generating encryption key...');
  const key = crypto.randomBytes(KEY_LENGTH);
  
  fs.writeFileSync(keyPath, key.toString('hex'), { mode: 0o600 });
  console.log(`✅ Encryption key created at: ${keyPath}`);
  console.log('⚠️  Keep this file secure - it\'s needed to decrypt your connections\n');
  
  return key;
}

/**
 * Encrypt data
 */
function encrypt(text) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: iv:encrypted:tag
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypt data
 */
function decrypt(encryptedText) {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const tag = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate a new encryption key (for manual setup)
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateKey,
  getEncryptionKey
};
