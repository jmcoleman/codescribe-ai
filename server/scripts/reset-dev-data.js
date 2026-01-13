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
console.log(`Mode:  ${colors.yellow}Clear all docs/batches/analytics/campaigns/trials${colors.reset}`);
console.log(`DB:    ${colors.yellow}${dbUrl.substring(0, 50)}...${colors.reset}\n`);

try {
  // Step 1: Check current counts
  const docsResult = await sql`SELECT COUNT(*) as count FROM generated_documents`;
  const batchesResult = await sql`SELECT COUNT(*) as count FROM generation_batches`;
  const analyticsResult = await sql`SELECT COUNT(*) as count FROM analytics_events`;
  const trialsResult = await sql`SELECT COUNT(*) as count FROM user_trials`;
  const campaignsResult = await sql`SELECT COUNT(*) as count FROM campaigns`;
  const quotasResult = await sql`SELECT COUNT(*) as count FROM user_quotas`;
  const auditResult = await sql`SELECT COUNT(*) as count FROM user_audit_log`;
  const testUsersResult = await sql`
    SELECT COUNT(*) as count FROM users
    WHERE email LIKE 'campaign.user%@test.com'
       OR email LIKE 'partner.user%@test.com'
       OR email LIKE 'individual.user%@test.com'
  `;

  const docCount = parseInt(docsResult.rows[0].count);
  const batchCount = parseInt(batchesResult.rows[0].count);
  const analyticsCount = parseInt(analyticsResult.rows[0].count);
  const trialsCount = parseInt(trialsResult.rows[0].count);
  const campaignsCount = parseInt(campaignsResult.rows[0].count);
  const quotasCount = parseInt(quotasResult.rows[0].count);
  const auditCount = parseInt(auditResult.rows[0].count);
  const testUsersCount = parseInt(testUsersResult.rows[0].count);

  console.log(`${colors.cyan}📊 Current data:${colors.reset}`);
  console.log(`   Documents:      ${docCount} record(s)`);
  console.log(`   Batches:        ${batchCount} record(s)`);
  console.log(`   Analytics:      ${analyticsCount} record(s)`);
  console.log(`   User Trials:    ${trialsCount} record(s)`);
  console.log(`   Campaigns:      ${campaignsCount} record(s)`);
  console.log(`   User Quotas:    ${quotasCount} record(s)`);
  console.log(`   Audit Logs:     ${auditCount} record(s)`);
  console.log(`   Test Users:     ${testUsersCount} record(s)\n`);

  if (docCount === 0 && batchCount === 0 && analyticsCount === 0 && trialsCount === 0 && campaignsCount === 0 && quotasCount === 0 && auditCount === 0 && testUsersCount === 0) {
    console.log(`${colors.yellow}⚠️  Nothing to clear - database is already clean${colors.reset}`);
    process.exit(0);
  }

  // Step 2: Clear the data (order matters for foreign keys)
  console.log(`${colors.yellow}⏳ Clearing data...${colors.reset}`);

  // Delete user audit logs (references users)
  const auditDeleteResult = await sql`DELETE FROM user_audit_log RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${auditDeleteResult.rowCount} audit log(s)${colors.reset}`);

  // Delete documents (references users and batches)
  const docsDeleteResult = await sql`DELETE FROM generated_documents RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${docsDeleteResult.rowCount} document(s)${colors.reset}`);

  // Delete batches (references users)
  const batchesDeleteResult = await sql`DELETE FROM generation_batches RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${batchesDeleteResult.rowCount} batch(es)${colors.reset}`);

  // Delete user trials (references users and campaigns)
  const trialsDeleteResult = await sql`DELETE FROM user_trials RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${trialsDeleteResult.rowCount} user trial(s)${colors.reset}`);

  // Delete user quotas (references users)
  const quotasDeleteResult = await sql`DELETE FROM user_quotas RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${quotasDeleteResult.rowCount} user quota(s)${colors.reset}`);

  // Delete campaigns
  const campaignsDeleteResult = await sql`DELETE FROM campaigns RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${campaignsDeleteResult.rowCount} campaign(s)${colors.reset}`);

  // Delete analytics events (references users)
  const analyticsDeleteResult = await sql`DELETE FROM analytics_events RETURNING *`;
  console.log(`${colors.green}✅ Deleted ${analyticsDeleteResult.rowCount} analytics event(s)${colors.reset}`);

  // Delete test users (campaign seed test users)
  const usersDeleteResult = await sql`
    DELETE FROM users
    WHERE email LIKE 'campaign.user%@test.com'
       OR email LIKE 'partner.user%@test.com'
       OR email LIKE 'individual.user%@test.com'
    RETURNING *
  `;
  console.log(`${colors.green}✅ Deleted ${usersDeleteResult.rowCount} test user(s)${colors.reset}`);

  console.log(`\n${colors.green}${colors.bright}✨ Dev data cleared successfully!${colors.reset}\n`);

} catch (error) {
  console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`);
  console.error(error);
  process.exit(1);
} finally {
  // Close database connection
  await sql.end();
}
