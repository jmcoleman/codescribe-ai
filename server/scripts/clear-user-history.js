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
const cleanupOrphans = args.includes('--cleanup-orphans');

// Get user identifier (email or ID)
const userIdentifier = args.find(arg => !arg.startsWith('--'));

if (!userIdentifier && !cleanupOrphans) {
  console.error('Usage: node scripts/clear-user-history.js <user_email_or_id> [--dry-run] [--batches] [--docs]');
  console.error('       node scripts/clear-user-history.js --cleanup-orphans [--dry-run]');
  console.error('');
  console.error('Options:');
  console.error('  --dry-run          Show what would be deleted without actually deleting');
  console.error('  --batches          Only clear batches (keep documents)');
  console.error('  --docs             Only clear documents (keep batches)');
  console.error('  --cleanup-orphans  Clean up all orphaned batches (no user required)');
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
  const results = { batches: 0, documents: 0, orphanedBatches: 0 };

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

    // Also clean up orphaned batches (batches with no linked documents)
    if (dryRun) {
      const orphanCount = await sql`
        SELECT COUNT(*) as count FROM generation_batches gb
        WHERE gb.user_id = ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM generated_documents gd WHERE gd.batch_id = gb.id
        )
      `;
      results.orphanedBatches = parseInt(orphanCount.rows[0].count);
    } else {
      const orphanResult = await sql`
        DELETE FROM generation_batches gb
        WHERE gb.user_id = ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM generated_documents gd WHERE gd.batch_id = gb.id
        )
        RETURNING id
      `;
      results.orphanedBatches = orphanResult.rowCount;
    }
  }

  return results;
}

async function cleanupAllOrphanedBatches(dryRun) {
  // Find and delete all orphaned batches across all users
  if (dryRun) {
    const result = await sql`
      SELECT gb.id, gb.user_id, gb.total_files, gb.created_at, u.email
      FROM generation_batches gb
      LEFT JOIN users u ON gb.user_id = u.id
      WHERE NOT EXISTS (
        SELECT 1 FROM generated_documents gd WHERE gd.batch_id = gb.id
      )
      ORDER BY gb.created_at DESC
    `;
    return { count: result.rows.length, batches: result.rows };
  } else {
    const result = await sql`
      DELETE FROM generation_batches gb
      WHERE NOT EXISTS (
        SELECT 1 FROM generated_documents gd WHERE gd.batch_id = gb.id
      )
      RETURNING id, user_id, total_files, created_at
    `;
    return { count: result.rowCount, batches: result.rows };
  }
}

async function main() {
  // Handle --cleanup-orphans mode
  if (cleanupOrphans) {
    console.log('🔍 Finding orphaned batches (batches with no documents)...');
    console.log('');

    const result = await cleanupAllOrphanedBatches(dryRun);

    if (result.count === 0) {
      console.log('✅ No orphaned batches found');
      process.exit(0);
    }

    if (dryRun) {
      console.log(`📋 Found ${result.count} orphaned batch(es):`);
      console.log('');
      for (const batch of result.batches) {
        const date = new Date(batch.created_at).toLocaleDateString();
        console.log(`   - Batch ${batch.id.slice(0, 8)}... (${batch.total_files} files) - User: ${batch.email || batch.user_id} - Created: ${date}`);
      }
      console.log('');
      console.log('💡 Run without --dry-run to delete these batches');
    } else {
      console.log(`✅ Deleted ${result.count} orphaned batch(es)`);
    }

    process.exit(0);
  }

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
    if (results.orphanedBatches > 0) {
      console.log(`   Orphaned batches: ${results.orphanedBatches} (batches with no documents)`);
    }
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
