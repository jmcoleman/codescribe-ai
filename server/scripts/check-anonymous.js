import 'dotenv/config';
import { sql } from '@vercel/postgres';

async function checkAnonymous() {
  try {
    console.log('Checking anonymous_quotas for IP ::1...\n');
    const result = await sql`
      SELECT
        ip_address,
        daily_count,
        monthly_count,
        period_start_date,
        last_reset_date,
        created_at,
        updated_at
      FROM anonymous_quotas
      WHERE ip_address = '::1'
      ORDER BY period_start_date DESC
    `;

    console.log('Found', result.rows.length, 'records:');
    console.log(JSON.stringify(result.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkAnonymous();
