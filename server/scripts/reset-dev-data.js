/**
 * Reset Dev Data Script
 *
 * Clears all generated documents, batches, and analytics events from the development database.
 *
 * Usage:
 *   npm run reset:data
 *
 * ⚠️  WARNING: This script is for DEVELOPMENT only!
 *     Always verify you're connected to the DEV database before running.
 */

import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};


// Verify database connection
const dbUrl = process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error(`${colors.red}❌ Error: POSTGRES_URL not found in environment${colors.reset}`);
  process.exit(1);
}

// Safety check - prevent running on production
if (dbUrl.includes('prod') || dbUrl.includes('production')) {
  console.error(`${colors.red}❌ DANGER: This appears to be a PRODUCTION database!${colors.reset}`);
  console.error(`${colors.yellow}This script should only be run on DEVELOPMENT databases.${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.cyan}${colors.bright}🗄️  Reset Dev Data${colors.reset}\n`);
console.log(`Mode:  ${colors.yellow}Clear all docs/batches/analytics${colors.reset}`);
console.log(`DB:    ${colors.yellow}${dbUrl.substring(0, 50)}...${colors.reset}\n`);

try {
  // Step 1: Check current counts
  const docsResult = await sql`SELECT COUNT(*) as count FROM generated_documents`;
  const batchesResult = await sql`SELECT COUNT(*) as count FROM generation_batches`;
  const analyticsResult = await sql`SELECT COUNT(*) as count FROM analytics_events`;

  const docCount = parseInt(docsResult.rows[0].count);
  const batchCount = parseInt(batchesResult.rows[0].count);
  const analyticsCount = parseInt(analyticsResult.rows[0].count);

  console.log(`${colors.cyan}📊 Current data:${colors.reset}`);
  console.log(`   Documents:  ${docCount} record(s)`);
  console.log(`   Batches:    ${batchCount} record(s)`);
  console.log(`   Analytics:  ${analyticsCount} record(s)\n`);

  if (docCount === 0 && batchCount === 0 && analyticsCount === 0) {
    console.log(`${colors.yellow}⚠️  Nothing to clear - database is already clean${colors.reset}`);
    process.exit(0);
  }

  // Step 2: Clear the data
  console.log(`${colors.yellow}⏳ Clearing data...${colors.reset}`);

  // Delete documents first (they reference batches via foreign key)
  const docsDeleteResult = await sql`DELETE FROM generated_documents RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${docsDeleteResult.rowCount} document(s)${colors.reset}`);

  // Delete batches
  const batchesDeleteResult = await sql`DELETE FROM generation_batches RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${batchesDeleteResult.rowCount} batch(es)${colors.reset}`);

  // Delete analytics events
  const analyticsDeleteResult = await sql`DELETE FROM analytics_events RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${analyticsDeleteResult.rowCount} analytics event(s)${colors.reset}`);

  console.log(`\n${colors.green}${colors.bright}✨ Dev data cleared successfully!${colors.reset}\n`);

} catch (error) {
  console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`);
  console.error(error);
  process.exit(1);
} finally {
  // Close database connection
  await sql.end();
}
