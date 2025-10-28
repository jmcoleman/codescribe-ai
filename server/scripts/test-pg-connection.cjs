require('dotenv').config({ path: '.env.test' });
const { sql } = require('@vercel/postgres');

async function testConnection() {
  try {
    console.log('🔌 Testing connection to:', process.env.POSTGRES_URL);
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Connection successful:', result.rows);
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
