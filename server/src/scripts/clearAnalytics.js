/**
 * Clear Analytics Data Script
 *
 * Deletes all analytics events from the database
 *
 * Usage: npm run clear:analytics
 */

import { sql } from '@vercel/postgres';

const clearAnalytics = async () => {
  console.log('🗑️  Clearing analytics data...\n');

  try {
    // Get count before deletion
    const beforeCount = await sql`
      SELECT COUNT(*) as count FROM analytics_events
    `;
    const totalEvents = parseInt(beforeCount.rows[0].count);

    console.log(`📊 Found ${totalEvents} analytics events`);

    if (totalEvents === 0) {
      console.log('✅ Analytics table is already empty\n');
      return;
    }

    // Delete all analytics events
    await sql`
      DELETE FROM analytics_events
    `;

    // Verify deletion
    const afterCount = await sql`
      SELECT COUNT(*) as count FROM analytics_events
    `;
    const remainingEvents = parseInt(afterCount.rows[0].count);

    if (remainingEvents === 0) {
      console.log(`✅ Deleted ${totalEvents} events successfully`);
      console.log('✅ Analytics table is now empty\n');
    } else {
      console.error(`❌ Warning: ${remainingEvents} events still remain`);
    }

  } catch (error) {
    console.error('❌ Error clearing analytics:', error);
    throw error;
  }
};

// Run clearing
clearAnalytics()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
