#!/usr/bin/env node

/**
 * Clear Generation History for a User
 *
 * Development utility script to clear all generation batches and documents
 * for a specific user.
 *
 * Usage:
 *   node scripts/clear-user-history.js <user_email_or_id>
 *
 * Examples:
 *   node scripts/clear-user-history.js test@example.com
 *   node scripts/clear-user-history.js 123
 *
 * Options:
 *   --dry-run    Show what would be deleted without actually deleting
 *   --batches    Only clear batches (keep documents)
 *   --docs       Only clear documents (keep batches)
 */

import 'dotenv/config';
import { sql } from '@vercel/postgres';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchesOnly = args.includes('--batches');
const docsOnly = args.includes('--docs');

// Get user identifier (email or ID)
const userIdentifier = args.find(arg => !arg.startsWith('--'));

if (!userIdentifier) {
  console.error('Usage: node scripts/clear-user-history.js <user_email_or_id> [--dry-run] [--batches] [--docs]');
  console.error('');
  console.error('Options:');
  console.error('  --dry-run    Show what would be deleted without actually deleting');
  console.error('  --batches    Only clear batches (keep documents)');
  console.error('  --docs       Only clear documents (keep batches)');
  process.exit(1);
}

async function findUser(identifier) {
  // Try to find by ID first (if numeric)
  if (/^\d+$/.test(identifier)) {
    const result = await sql`
      SELECT u.id, u.email, u.first_name, u.last_name, u.tier,
             ut.id as trial_id, ut.status as trial_status, ut.ends_at as trial_ends_at
      FROM users u
      LEFT JOIN user_trials ut ON u.id = ut.user_id AND ut.status = 'active'
      WHERE u.id = ${parseInt(identifier)}
    `;
    if (result.rows.length > 0) {
      return result.rows[0];
    }
  }

  // Try to find by email
  const result = await sql`
    SELECT u.id, u.email, u.first_name, u.last_name, u.tier,
           ut.id as trial_id, ut.status as trial_status, ut.ends_at as trial_ends_at
    FROM users u
    LEFT JOIN user_trials ut ON u.id = ut.user_id AND ut.status = 'active'
    WHERE u.email = ${identifier}
  `;

  return result.rows[0] || null;
}

async function getStats(userId) {
  const batchCount = await sql`
    SELECT COUNT(*) as count FROM generation_batches WHERE user_id = ${userId}
  `;

  const docCount = await sql`
    SELECT COUNT(*) as count FROM generated_documents WHERE user_id = ${userId}
  `;

  return {
    batches: parseInt(batchCount.rows[0].count),
    documents: parseInt(docCount.rows[0].count)
  };
}

async function clearHistory(userId, options = {}) {
  const { dryRun, batchesOnly, docsOnly } = options;
  const results = { batches: 0, documents: 0 };

  if (!docsOnly) {
    // Clear batches
    if (dryRun) {
      const count = await sql`
        SELECT COUNT(*) as count FROM generation_batches WHERE user_id = ${userId}
      `;
      results.batches = parseInt(count.rows[0].count);
    } else {
      const result = await sql`
        DELETE FROM generation_batches WHERE user_id = ${userId}
        RETURNING id
      `;
      results.batches = result.rowCount;
    }
  }

  if (!batchesOnly) {
    // Clear documents (soft delete by setting deleted_at, or hard delete)
    if (dryRun) {
      const count = await sql`
        SELECT COUNT(*) as count FROM generated_documents WHERE user_id = ${userId}
      `;
      results.documents = parseInt(count.rows[0].count);
    } else {
      // Hard delete for dev environments
      const result = await sql`
        DELETE FROM generated_documents WHERE user_id = ${userId}
        RETURNING id
      `;
      results.documents = result.rowCount;
    }
  }

  return results;
}

async function main() {
  console.log('🔍 Looking up user...');

  const user = await findUser(userIdentifier);

  if (!user) {
    console.error(`❌ User not found: ${userIdentifier}`);
    process.exit(1);
  }

  console.log('');
  console.log('📋 User found:');
  console.log(`   ID:    ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name:  ${user.first_name || ''} ${user.last_name || ''}`.trim() || '   Name:  (not set)');
  console.log(`   Tier:  ${user.tier}`);
  if (user.trial_id) {
    const endsAt = new Date(user.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));
    console.log(`   Trial: ✅ Active (${daysLeft > 0 ? `${daysLeft} days left` : 'expired'})`);
  }
  console.log('');

  // Get current stats
  const stats = await getStats(user.id);
  console.log('📊 Current history:');
  console.log(`   Batches:   ${stats.batches}`);
  console.log(`   Documents: ${stats.documents}`);
  console.log('');

  if (stats.batches === 0 && stats.documents === 0) {
    console.log('✅ No history to clear');
    process.exit(0);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN - No changes will be made');
    console.log('');
  }

  // Determine what to clear
  let clearingMsg = 'Clearing';
  if (batchesOnly) {
    clearingMsg += ' batches only';
  } else if (docsOnly) {
    clearingMsg += ' documents only';
  } else {
    clearingMsg += ' all history';
  }
  console.log(`${dryRun ? '🔍' : '🗑️ '} ${clearingMsg}...`);

  const results = await clearHistory(user.id, { dryRun, batchesOnly, docsOnly });

  console.log('');
  if (dryRun) {
    console.log('📋 Would delete:');
  } else {
    console.log('✅ Deleted:');
  }

  if (!docsOnly) {
    console.log(`   Batches:   ${results.batches}`);
  }
  if (!batchesOnly) {
    console.log(`   Documents: ${results.documents}`);
  }

  console.log('');
  if (dryRun) {
    console.log('💡 Run without --dry-run to actually delete');
  } else {
    console.log('✅ Done!');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
