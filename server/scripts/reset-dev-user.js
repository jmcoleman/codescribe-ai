/**
 * Reset Dev User Data Script
 *
 * Usage:
 *   npm run reset:user <email> [--quotas-only]
 *
 * Examples:
 *   npm run reset:user john@example.com              # Delete user and all data
 *   npm run reset:user john@example.com --quotas-only # Reset quotas only
 *
 * Options:
 *   --quotas-only    Only reset usage quotas, keep user account
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

// Validate inputs
if (!email) {
  console.error(`${colors.red}❌ Error: Email address is required${colors.reset}`);
  console.log(`\nUsage: npm run reset:user <email> [--quotas-only]\n`);
  console.log(`Examples:`);
  console.log(`  npm run reset:user john@example.com              ${colors.cyan}# Delete user and all data${colors.reset}`);
  console.log(`  npm run reset:user john@example.com --quotas-only ${colors.cyan}# Reset quotas only${colors.reset}`);
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

console.log(`${colors.cyan}${colors.bright}🗄️  Reset Dev User Data${colors.reset}\n`);
console.log(`Email: ${colors.yellow}${email}${colors.reset}`);
console.log(`Mode:  ${colors.yellow}${quotasOnly ? 'Reset quotas only' : 'Delete user and all data'}${colors.reset}`);
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

  // Step 2: Check what data will be deleted
  const quotasResult = await sql`
    SELECT COUNT(*) as count
    FROM user_quotas
    WHERE user_id = ${user.id}
  `;

  const quotaCount = parseInt(quotasResult.rows[0].count);
  console.log(`${colors.cyan}📊 Data to be ${quotasOnly ? 'reset' : 'deleted'}:${colors.reset}`);
  console.log(`   User quotas: ${quotaCount} record(s)`);

  if (!quotasOnly) {
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
