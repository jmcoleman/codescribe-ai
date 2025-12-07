/**
 * Reset Dev User Data Script
 *
 * Usage:
 *   npm run reset:user <email> [options]
 *
 * Examples:
 *   npm run reset:user john@example.com              # Delete user and all data
 *   npm run reset:user john@example.com --quotas-only # Reset quotas only
 *   npm run reset:user john@example.com --clear-docs  # Clear docs/batches + reset quotas
 *
 * Options:
 *   --quotas-only    Only reset usage quotas, keep user account
 *   --clear-docs     Clear generated_documents and generation_batches for user, reset quotas
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

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0];
const quotasOnly = args.includes('--quotas-only');
const clearDocs = args.includes('--clear-docs');

// Validate inputs
if (!email) {
  console.error(`${colors.red}❌ Error: Email address is required${colors.reset}`);
  console.log(`\nUsage: npm run reset:user <email> [options]\n`);
  console.log(`Examples:`);
  console.log(`  npm run reset:user john@example.com              ${colors.cyan}# Delete user and all data${colors.reset}`);
  console.log(`  npm run reset:user john@example.com --quotas-only ${colors.cyan}# Reset quotas only${colors.reset}`);
  console.log(`  npm run reset:user john@example.com --clear-docs  ${colors.cyan}# Clear docs/batches + reset quotas${colors.reset}`);
  process.exit(1);
}

// Validate mutually exclusive options
if (quotasOnly && clearDocs) {
  console.error(`${colors.red}❌ Error: --quotas-only and --clear-docs cannot be used together${colors.reset}`);
  process.exit(1);
}

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

const modeDescription = quotasOnly
  ? 'Reset quotas only'
  : clearDocs
    ? 'Clear docs/batches + reset quotas'
    : 'Delete user and all data';

console.log(`${colors.cyan}${colors.bright}🗄️  Reset Dev User Data${colors.reset}\n`);
console.log(`Email: ${colors.yellow}${email}${colors.reset}`);
console.log(`Mode:  ${colors.yellow}${modeDescription}${colors.reset}`);
console.log(`DB:    ${colors.yellow}${dbUrl.substring(0, 50)}...${colors.reset}\n`);

try {
  // Step 1: Check if user exists
  const userResult = await sql`
    SELECT id, email, tier, email_verified, github_id, created_at
    FROM users
    WHERE email = ${email}
  `;

  if (userResult.rows.length === 0) {
    console.log(`${colors.yellow}⚠️  User not found: ${email}${colors.reset}`);
    process.exit(0);
  }

  const user = userResult.rows[0];
  console.log(`${colors.green}✅ User found:${colors.reset}`);
  console.log(`   ID:       ${user.id}`);
  console.log(`   Tier:     ${user.tier}`);
  console.log(`   Verified: ${user.email_verified ? 'Yes' : 'No'}`);
  console.log(`   Auth:     ${user.github_id ? 'GitHub OAuth' : 'Email/Password'}`);
  console.log(`   Created:  ${new Date(user.created_at).toLocaleString()}\n`);

  // Step 2: Check what data will be affected
  const quotasResult = await sql`
    SELECT COUNT(*) as count
    FROM user_quotas
    WHERE user_id = ${user.id}
  `;

  const quotaCount = parseInt(quotasResult.rows[0].count);
  const actionWord = quotasOnly ? 'reset' : clearDocs ? 'cleared/reset' : 'deleted';
  console.log(`${colors.cyan}📊 Data to be ${actionWord}:${colors.reset}`);
  console.log(`   User quotas: ${quotaCount} record(s)`);

  if (clearDocs || !quotasOnly) {
    const docsResult = await sql`
      SELECT COUNT(*) as count
      FROM generated_documents
      WHERE user_id = ${user.id}
    `;
    const batchesResult = await sql`
      SELECT COUNT(*) as count
      FROM generation_batches
      WHERE user_id = ${user.id}
    `;
    const docCount = parseInt(docsResult.rows[0].count);
    const batchCount = parseInt(batchesResult.rows[0].count);
    console.log(`   Documents:   ${docCount} record(s)`);
    console.log(`   Batches:     ${batchCount} record(s)`);
  }

  if (!quotasOnly && !clearDocs) {
    const sessionsResult = await sql`
      SELECT COUNT(*) as count
      FROM sessions
      WHERE sess->>'userId' = ${user.id}
    `;
    const sessionCount = parseInt(sessionsResult.rows[0].count);
    console.log(`   Sessions:    ${sessionCount} record(s)`);
    console.log(`   User:        1 record`);
  }

  console.log();

  // Step 3: Perform the deletion/reset
  if (quotasOnly) {
    // Reset quotas only
    console.log(`${colors.yellow}⏳ Resetting quotas...${colors.reset}`);

    const deleteResult = await sql`
      DELETE FROM user_quotas
      WHERE user_id = ${user.id}
      RETURNING *
    `;

    console.log(`${colors.green}✅ Successfully reset ${deleteResult.rowCount} quota record(s)${colors.reset}`);
    console.log(`\n${colors.cyan}ℹ️  Quotas will be recreated on next API request${colors.reset}`);
  } else if (clearDocs) {
    // Clear documents/batches and reset quotas (keep user account)
    console.log(`${colors.yellow}⏳ Clearing documents and batches...${colors.reset}`);

    // Delete documents first (they reference batches)
    const docsResult = await sql`
      DELETE FROM generated_documents
      WHERE user_id = ${user.id}
      RETURNING *
    `;
    console.log(`${colors.green}✅ Deleted ${docsResult.rowCount} document(s)${colors.reset}`);

    // Delete batches
    const batchesResult = await sql`
      DELETE FROM generation_batches
      WHERE user_id = ${user.id}
      RETURNING *
    `;
    console.log(`${colors.green}✅ Deleted ${batchesResult.rowCount} batch(es)${colors.reset}`);

    // Reset quotas
    const quotasDeleteResult = await sql`
      DELETE FROM user_quotas
      WHERE user_id = ${user.id}
      RETURNING *
    `;
    console.log(`${colors.green}✅ Reset ${quotasDeleteResult.rowCount} quota record(s)${colors.reset}`);

    console.log(`\n${colors.cyan}ℹ️  User account preserved. Quotas will be recreated on next API request${colors.reset}`);
  } else {
    // Delete user and all related data
    console.log(`${colors.yellow}⏳ Deleting user and all related data...${colors.reset}`);

    // Delete sessions first (no foreign key, manual cleanup)
    await sql`
      DELETE FROM sessions
      WHERE sess->>'userId' = ${user.id}
    `;

    // Delete user (cascades to user_quotas via ON DELETE CASCADE)
    const deleteResult = await sql`
      DELETE FROM users
      WHERE id = ${user.id}
      RETURNING *
    `;

    console.log(`${colors.green}✅ Successfully deleted user and all related data${colors.reset}`);
  }

  console.log(`\n${colors.green}${colors.bright}✨ Operation completed successfully!${colors.reset}\n`);

} catch (error) {
  console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`);
  console.error(error);
  process.exit(1);
} finally {
  // Close database connection
  await sql.end();
}
