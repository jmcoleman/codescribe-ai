import 'dotenv/config';
import { sql } from '@vercel/postgres';

async function checkData() {
  try {
    console.log('Checking user_quotas for user_id 3188...\n');
    const result = await sql`
      SELECT
        user_id,
        daily_count,
        monthly_count,
        period_start_date,
        last_reset_date,
        created_at,
        updated_at
      FROM user_quotas
      WHERE user_id = 3188
      ORDER BY period_start_date DESC
    `;

    console.log('Found', result.rows.length, 'records:');
    console.log(JSON.stringify(result.rows, null, 2));

    console.log('\n=== Current month calculation ===');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodStartString = periodStart.toISOString().split('T')[0];
    console.log('Today:', today);
    console.log('Period start (local):', periodStart);
    console.log('Period start (ISO):', periodStart.toISOString());
    console.log('Period start date string:', periodStartString);
    console.log('Database period_start_date:', result.rows[0].period_start_date);

    console.log('\n=== Testing exact match query (NEW) ===');
    const exactMatch = await sql`
      SELECT
        user_id,
        daily_count,
        monthly_count,
        last_reset_date,
        period_start_date
      FROM user_quotas
      WHERE user_id = 3188
        AND period_start_date = ${periodStartString}
    `;
    console.log('Exact match result:', JSON.stringify(exactMatch.rows, null, 2));

    console.log('\n=== Testing <= query (OLD) ===');
    const lessThanEqual = await sql`
      SELECT
        user_id,
        daily_count,
        monthly_count,
        last_reset_date,
        period_start_date
      FROM user_quotas
      WHERE user_id = 3188
        AND period_start_date <= ${periodStartString}
      ORDER BY period_start_date DESC
      LIMIT 1
    `;
    console.log('<= match result:', JSON.stringify(lessThanEqual.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkData();
