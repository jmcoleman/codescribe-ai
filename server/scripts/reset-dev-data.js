/**
 * Reset Dev Data Script
 *
 * Clears ALL user and analytics data from the development database.
 * Use this to reset the dev environment for fresh testing.
 *
 * Usage:
 *   npm run reset:data -- --confirm
 *
 * ⚠️  WARNING: This script is for DEVELOPMENT only!
 *     This will DELETE ALL USERS AND ALL DATA!
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
if (process.env.NODE_ENV === 'production' || dbUrl.includes('prod') || dbUrl.includes('production')) {
  console.error(`${colors.red}❌ DANGER: This appears to be a PRODUCTION database!${colors.reset}`);
  console.error(`${colors.yellow}This script should only be run on DEVELOPMENT databases.${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.cyan}${colors.bright}🗄️  Reset Dev Data - COMPLETE WIPE${colors.reset}\n`);
console.log(`${colors.red}${colors.bright}⚠️  WARNING: This will DELETE ALL DATA including:${colors.reset}`);
console.log(`   • All users (and their documents, trials)`);
console.log(`   • All analytics events and audit logs`);
console.log(`   • All trial programs and invite codes`);
console.log(`   • All projects, workspace files, and graphs\n`);
console.log(`DB:    ${colors.yellow}${dbUrl.substring(0, 60)}...${colors.reset}\n`);

(async () => {
try {
  // Step 1: Check current counts
  const usersResult = await sql`SELECT COUNT(*) as count FROM users`;
  const generatedDocsResult = await sql`SELECT COUNT(*) as count FROM generated_documents`;
  const batchesResult = await sql`SELECT COUNT(*) as count FROM generation_batches`;
  const workspaceFilesResult = await sql`SELECT COUNT(*) as count FROM workspace_files`;
  const analyticsResult = await sql`SELECT COUNT(*) as count FROM analytics_events`;
  const auditLogsResult = await sql`SELECT COUNT(*) as count FROM audit_logs`;
  const userAuditLogsResult = await sql`SELECT COUNT(*) as count FROM user_audit_log`;
  const adminAuditLogsResult = await sql`SELECT COUNT(*) as count FROM admin_audit_log`;
  const trialsResult = await sql`SELECT COUNT(*) as count FROM user_trials`;
  const trialProgramsResult = await sql`SELECT COUNT(*) as count FROM trial_programs`;
  const inviteCodesResult = await sql`SELECT COUNT(*) as count FROM invite_codes`;
  const projectsResult = await sql`SELECT COUNT(*) as count FROM projects`;
  const projectGraphsResult = await sql`SELECT COUNT(*) as count FROM project_graphs`;

  const userCount = parseInt(usersResult.rows[0].count);
  const generatedDocsCount = parseInt(generatedDocsResult.rows[0].count);
  const batchesCount = parseInt(batchesResult.rows[0].count);
  const workspaceFilesCount = parseInt(workspaceFilesResult.rows[0].count);
  const analyticsCount = parseInt(analyticsResult.rows[0].count);
  const auditLogsCount = parseInt(auditLogsResult.rows[0].count);
  const userAuditLogsCount = parseInt(userAuditLogsResult.rows[0].count);
  const adminAuditLogsCount = parseInt(adminAuditLogsResult.rows[0].count);
  const trialsCount = parseInt(trialsResult.rows[0].count);
  const trialProgramsCount = parseInt(trialProgramsResult.rows[0].count);
  const inviteCodesCount = parseInt(inviteCodesResult.rows[0].count);
  const projectsCount = parseInt(projectsResult.rows[0].count);
  const projectGraphsCount = parseInt(projectGraphsResult.rows[0].count);

  console.log(`${colors.cyan}📊 Current data:${colors.reset}`);
  console.log(`   Users:             ${userCount} record(s)`);
  console.log(`   Generated Docs:    ${generatedDocsCount} record(s)`);
  console.log(`   Gen Batches:       ${batchesCount} record(s)`);
  console.log(`   Workspace Files:   ${workspaceFilesCount} record(s)`);
  console.log(`   Analytics:         ${analyticsCount} record(s)`);
  console.log(`   Audit Logs:        ${auditLogsCount} record(s)`);
  console.log(`   User Audit Logs:   ${userAuditLogsCount} record(s)`);
  console.log(`   Admin Audit Logs:  ${adminAuditLogsCount} record(s)`);
  console.log(`   User Trials:       ${trialsCount} record(s)`);
  console.log(`   Trial Programs:    ${trialProgramsCount} record(s)`);
  console.log(`   Invite Codes:      ${inviteCodesCount} record(s)`);
  console.log(`   Projects:          ${projectsCount} record(s)`);
  console.log(`   Project Graphs:    ${projectGraphsCount} record(s)\n`);

  const totalRecords = userCount + generatedDocsCount + batchesCount + workspaceFilesCount +
                       analyticsCount + auditLogsCount + userAuditLogsCount + adminAuditLogsCount +
                       trialsCount + trialProgramsCount + inviteCodesCount + projectsCount + projectGraphsCount;

  if (totalRecords === 0) {
    console.log(`${colors.yellow}⚠️  Nothing to clear - database is already clean${colors.reset}`);
    process.exit(0);
  }

  // Check for confirmation flag
  const hasConfirmFlag = process.argv.includes('--confirm');

  if (!hasConfirmFlag) {
    console.log(`${colors.red}❌ Confirmation required!${colors.reset}`);
    console.log(`${colors.yellow}To confirm deletion, run: npm run reset:data -- --confirm${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Confirmation received, proceeding with deletion...${colors.reset}\n`);

  // Step 2: Clear the data (order matters for foreign keys)
  console.log(`\n${colors.yellow}⏳ Clearing data...${colors.reset}\n`);

  // Delete analytics events (references users)
  const analyticsDeleteResult = await sql`DELETE FROM analytics_events`;
  console.log(`${colors.green}✅ Deleted ${analyticsDeleteResult.rowCount} analytics event(s)${colors.reset}`);

  // Delete audit logs (references users)
  const auditLogsDeleteResult = await sql`DELETE FROM audit_logs`;
  console.log(`${colors.green}✅ Deleted ${auditLogsDeleteResult.rowCount} audit log(s)${colors.reset}`);

  // Delete user audit logs (references users)
  const userAuditLogsDeleteResult = await sql`DELETE FROM user_audit_log`;
  console.log(`${colors.green}✅ Deleted ${userAuditLogsDeleteResult.rowCount} user audit log(s)${colors.reset}`);

  // Delete admin audit logs (references users)
  const adminAuditLogsDeleteResult = await sql`DELETE FROM admin_audit_log`;
  console.log(`${colors.green}✅ Deleted ${adminAuditLogsDeleteResult.rowCount} admin audit log(s)${colors.reset}`);

  // Delete workspace files (references users and generated_documents)
  const workspaceFilesDeleteResult = await sql`DELETE FROM workspace_files`;
  console.log(`${colors.green}✅ Deleted ${workspaceFilesDeleteResult.rowCount} workspace file(s)${colors.reset}`);

  // Delete generated documents (references users and generation_batches)
  const generatedDocsDeleteResult = await sql`DELETE FROM generated_documents`;
  console.log(`${colors.green}✅ Deleted ${generatedDocsDeleteResult.rowCount} generated document(s)${colors.reset}`);

  // Delete generation batches (references users)
  const batchesDeleteResult = await sql`DELETE FROM generation_batches`;
  console.log(`${colors.green}✅ Deleted ${batchesDeleteResult.rowCount} generation batch(es)${colors.reset}`);

  // Delete project graphs (references users)
  const projectGraphsDeleteResult = await sql`DELETE FROM project_graphs`;
  console.log(`${colors.green}✅ Deleted ${projectGraphsDeleteResult.rowCount} project graph(s)${colors.reset}`);

  // Delete projects (references users)
  const projectsDeleteResult = await sql`DELETE FROM projects`;
  console.log(`${colors.green}✅ Deleted ${projectsDeleteResult.rowCount} project(s)${colors.reset}`);

  // Delete user_trials (references users and trial_programs)
  const trialsDeleteResult = await sql`DELETE FROM user_trials`;
  console.log(`${colors.green}✅ Deleted ${trialsDeleteResult.rowCount} user trial(s)${colors.reset}`);

  // Delete invite codes (references trial_programs)
  const inviteCodesDeleteResult = await sql`DELETE FROM invite_codes`;
  console.log(`${colors.green}✅ Deleted ${inviteCodesDeleteResult.rowCount} invite code(s)${colors.reset}`);

  // Delete trial programs
  const trialProgramsDeleteResult = await sql`DELETE FROM trial_programs`;
  console.log(`${colors.green}✅ Deleted ${trialProgramsDeleteResult.rowCount} trial program(s)${colors.reset}`);

  // Delete all users (will cascade to any remaining related records)
  const usersDeleteResult = await sql`DELETE FROM users`;
  console.log(`${colors.green}✅ Deleted ${usersDeleteResult.rowCount} user(s)${colors.reset}`);

  // Reset sequences to start fresh (only for tables with serial/identity IDs, not UUIDs)
  console.log(`\n${colors.yellow}⏳ Resetting sequences...${colors.reset}`);
  await sql`SELECT setval('users_id_seq', 1, false)`;
  // analytics_events uses UUID, no sequence to reset
  await sql`SELECT setval('audit_logs_id_seq', 1, false)`;
  await sql`SELECT setval('invite_codes_id_seq', 1, false)`;
  await sql`SELECT setval('trial_programs_id_seq', 1, false)`;
  await sql`SELECT setval('user_trials_id_seq', 1, false)`;
  await sql`SELECT setval('projects_id_seq', 1, false)`;
  await sql`SELECT setval('project_graphs_id_seq', 1, false)`;
  console.log(`${colors.green}✅ All sequences reset to 1${colors.reset}`);

  console.log(`\n${colors.green}${colors.bright}✨ Dev data cleared successfully!${colors.reset}`);
  console.log(`${colors.cyan}📊 Total records deleted: ${
    analyticsDeleteResult.rowCount +
    auditLogsDeleteResult.rowCount +
    userAuditLogsDeleteResult.rowCount +
    adminAuditLogsDeleteResult.rowCount +
    workspaceFilesDeleteResult.rowCount +
    generatedDocsDeleteResult.rowCount +
    batchesDeleteResult.rowCount +
    projectGraphsDeleteResult.rowCount +
    projectsDeleteResult.rowCount +
    trialsDeleteResult.rowCount +
    inviteCodesDeleteResult.rowCount +
    trialProgramsDeleteResult.rowCount +
    usersDeleteResult.rowCount
  }${colors.reset}\n`);
  console.log(`${colors.yellow}You can now run fresh tests with clean data.${colors.reset}\n`);

} catch (error) {
  console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`);
  console.error(error);
  process.exit(1);
} finally {
  // Close database connection
  await sql.end();
}
})();
