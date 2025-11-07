import { sql } from '@vercel/postgres';

async function checkUsage() {
  try {
    // Get all anonymous usage records
    const result = await sql`
      SELECT
        ip_address,
        daily_count,
        monthly_count,
        last_reset_date,
        created_at
      FROM anonymous_quotas
      ORDER BY last_reset_date DESC
      LIMIT 10
    `;

    console.log('\n=== Recent Anonymous Usage ===');
    console.log(`Total records: ${result.rows.length}\n`);

    if (result.rows.length === 0) {
      console.log('No anonymous usage records found!');
      console.log('\nThis could mean:');
      console.log('1. No anonymous generations have been made');
      console.log('2. Usage tracking is not working');
      console.log('3. IP detection is failing');
    } else {
      result.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. IP: ${row.ip_address}`);
        console.log(`   Daily: ${row.daily_count}, Monthly: ${row.monthly_count}`);
        console.log(`   Last activity: ${row.last_reset_date}`);
        console.log(`   Created: ${row.created_at}\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsage();
