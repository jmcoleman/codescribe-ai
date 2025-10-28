/**
 * Load test environment variables
 * This runs before Jest starts
 */

const { config } = require('dotenv');
const { resolve } = require('path');

// Load .env.test from server root
const envPath = resolve(__dirname, '../../../../.env.test');
config({ path: envPath });

console.log('📝 Loaded test environment from .env.test');
console.log(`   Database: ${process.env.POSTGRES_URL ? '✅ Configured' : '❌ Missing'}`);
