/**
 * Seed Trial Program Data Script
 *
 * Populates test data for campaign analytics including:
 * 1. Auto-trial programs (Winter Launch Trial Program, Partner Program)
 * 2. User trials (campaign vs individual/self-serve)
 * 3. Conversions and usage patterns
 * 4. Time-to-value metrics
 *
 * Database Schema:
 * - campaigns: Auto-trial programs (no invite codes)
 * - user_trials: Links to campaigns via trial_program_id, source='auto_campaign' or 'self_serve'
 * - trial_tier: Only 'pro' or 'team' allowed (not 'business')
 *
 * Usage: npm run seed:campaigns
 */

import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

// Helper to generate random date within range
const randomDateBetween = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to add hours to a date
const addHours = (date, hours) => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};

// Helper to add days to a date
const addDays = (date, days) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

const seedCampaigns = async () => {
  console.log('🌱 Starting campaign seed...\n');

  try {
    // Define date range (last 30 days for good spread)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    // Step 1: Create campaigns
    console.log('📋 Creating trialPrograms...');

    // Trial Program 1: Winter Launch Trial Program (active)
    const campaign1 = await sql`
      INSERT INTO trial_programs (
        name, trial_tier, trial_days,
        is_active, starts_at, ends_at
      )
      VALUES (
        'Winter Launch Trial Program - Test', 'pro', 14,
        true, ${startDate}, ${endDate}
      )
      RETURNING id, name
    `;

    console.log(`   ✓ Trial Program 1: ${campaign1.rows[0].name} (ID: ${campaign1.rows[0].id})`);

    // Trial Program 2: Partner Program
    const campaign2 = await sql`
      INSERT INTO trial_programs (
        name, trial_tier, trial_days,
        is_active, starts_at, ends_at
      )
      VALUES (
        'Partner Program - Test', 'team', 30,
        false, ${startDate}, ${endDate}
      )
      RETURNING id, name
    `;

    console.log(`   ✓ Trial Program 2: ${campaign2.rows[0].name} (ID: ${campaign2.rows[0].id})\n`);

    // Step 2: Create test users with trials
    console.log('👥 Creating test users with trials...');

    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    const users = [];

    // Trial Program trial users (Winter Launch Trial Program) - 15 users
    console.log('   Creating 15 campaign trial users (Winter Launch Trial Program)...');
    const campaign1ConversionTarget = 6; // 6 out of 15 = 40% (deterministic)
    for (let i = 1; i <= 15; i++) {
      const signupDate = randomDateBetween(startDate, endDate);
      const emailVerifiedAt = addHours(signupDate, Math.random() * 6); // 0-6 hours to verify

      const user = await sql`
        INSERT INTO users (
          email, password_hash, first_name, last_name, tier,
          email_verified, email_verified_at, created_at
        )
        VALUES (
          ${`trialProgram.user${i}@test.com`},
          ${hashedPassword},
          ${`Trial Program${i}`},
          'User',
          'free',
          true,
          ${emailVerifiedAt},
          ${signupDate}
        )
        RETURNING id, email, created_at, email_verified_at
      `;

      users.push({ ...user.rows[0], trial_program_id: campaign1.rows[0].id, isCampaign: true });

      // Create trial with deterministic conversion
      const trialStarted = addHours(emailVerifiedAt, Math.random() * 2); // Start trial 0-2 hours after verification
      const shouldConvert = i <= campaign1ConversionTarget; // First 6 users convert (40%)
      const status = shouldConvert ? 'converted' : (Math.random() < 0.7 ? 'active' : 'expired');
      const convertedAt = shouldConvert ? addDays(trialStarted, Math.floor(Math.random() * 14)) : null;

      await sql`
        INSERT INTO user_trials (
          user_id, trial_program_id, source, trial_tier, started_at, ends_at,
          status, converted_at
        )
        VALUES (
          ${user.rows[0].id},
          ${campaign1.rows[0].id},
          'auto_campaign',
          'pro',
          ${trialStarted},
          ${addDays(trialStarted, 14)},
          ${status},
          ${convertedAt}
        )
      `;

      if (shouldConvert) {
        // Update user to pro tier if converted
        await sql`
          UPDATE users SET tier = 'pro' WHERE id = ${user.rows[0].id}
        `;
      }
    }

    // Trial Program trial users (Partner Program) - 8 users
    console.log('   Creating 8 campaign trial users (Partner Program)...');
    const campaign2ConversionTarget = 4; // 4 out of 8 = 50% (deterministic)
    for (let i = 1; i <= 8; i++) {
      const signupDate = randomDateBetween(startDate, endDate);
      const emailVerifiedAt = addHours(signupDate, Math.random() * 6);

      const user = await sql`
        INSERT INTO users (
          email, password_hash, first_name, last_name, tier,
          email_verified, email_verified_at, created_at
        )
        VALUES (
          ${`partner.user${i}@test.com`},
          ${hashedPassword},
          ${`Partner${i}`},
          'User',
          'free',
          true,
          ${emailVerifiedAt},
          ${signupDate}
        )
        RETURNING id, email, created_at, email_verified_at
      `;

      users.push({ ...user.rows[0], trial_program_id: campaign2.rows[0].id, isCampaign: true });

      const trialStarted = addHours(emailVerifiedAt, Math.random() * 2);
      const shouldConvert = i <= campaign2ConversionTarget; // First 4 users convert (50%)
      const status = shouldConvert ? 'converted' : (Math.random() < 0.6 ? 'active' : 'expired');
      const convertedAt = shouldConvert ? addDays(trialStarted, Math.floor(Math.random() * 30)) : null;

      await sql`
        INSERT INTO user_trials (
          user_id, trial_program_id, source, trial_tier, started_at, ends_at,
          status, converted_at
        )
        VALUES (
          ${user.rows[0].id},
          ${campaign2.rows[0].id},
          'auto_campaign',
          'team',
          ${trialStarted},
          ${addDays(trialStarted, 30)},
          ${status},
          ${convertedAt}
        )
      `;

      if (shouldConvert) {
        await sql`
          UPDATE users SET tier = 'team' WHERE id = ${user.rows[0].id}
        `;
      }
    }

    // Individual trial users (no campaign) - 10 users
    console.log('   Creating 10 individual trial users (no campaign)...');
    const individualConversionTarget = 2; // 2 out of 10 = 20% (deterministic, lower than campaigns)
    for (let i = 1; i <= 10; i++) {
      const signupDate = randomDateBetween(startDate, endDate);
      const emailVerifiedAt = addHours(signupDate, Math.random() * 6);

      const user = await sql`
        INSERT INTO users (
          email, password_hash, first_name, last_name, tier,
          email_verified, email_verified_at, created_at
        )
        VALUES (
          ${`individual.user${i}@test.com`},
          ${hashedPassword},
          ${`Individual${i}`},
          'User',
          'free',
          true,
          ${emailVerifiedAt},
          ${signupDate}
        )
        RETURNING id, email, created_at, email_verified_at
      `;

      users.push({ ...user.rows[0], trial_program_id: null, isCampaign: false });

      const trialStarted = addHours(emailVerifiedAt, Math.random() * 2);
      const shouldConvert = i <= individualConversionTarget; // First 2 users convert (20%, lower than campaigns)
      const status = shouldConvert ? 'converted' : (Math.random() < 0.65 ? 'active' : 'expired');
      const convertedAt = shouldConvert ? addDays(trialStarted, Math.floor(Math.random() * 14)) : null;
      const tier = Math.random() < 0.5 ? 'pro' : 'team';

      await sql`
        INSERT INTO user_trials (
          user_id, trial_program_id, source, trial_tier, started_at, ends_at,
          status, converted_at
        )
        VALUES (
          ${user.rows[0].id},
          NULL,
          'self_serve',
          ${tier},
          ${trialStarted},
          ${addDays(trialStarted, tier === 'pro' ? 14 : 30)},
          ${status},
          ${convertedAt}
        )
      `;

      if (shouldConvert) {
        await sql`
          UPDATE users SET tier = ${tier} WHERE id = ${user.rows[0].id}
        `;
      }
    }

    console.log(`   ✓ Created ${users.length} test users with trials\n`);

    // Step 3: Create usage patterns (for usage segments)
    console.log('📊 Creating usage patterns...');

    // Ensure user_quotas exist for all users
    for (const user of users) {
      // Get or create user_quotas
      const existingQuota = await sql`
        SELECT id FROM user_quotas WHERE user_id = ${user.id}
      `;

      if (existingQuota.rows.length === 0) {
        await sql`
          INSERT INTO user_quotas (user_id, monthly_count)
          VALUES (${user.id}, 0)
        `;
      }

      // Assign usage level based on distribution
      const rand = Math.random();
      let usageCount = 0;

      if (rand < 0.25) {
        // 25% - No usage
        usageCount = 0;
      } else if (rand < 0.45) {
        // 20% - Light (1-9)
        usageCount = Math.floor(Math.random() * 9) + 1;
      } else if (rand < 0.70) {
        // 25% - Engaged (10-49)
        usageCount = Math.floor(Math.random() * 40) + 10;
      } else if (rand < 0.85) {
        // 15% - Power (50-99)
        usageCount = Math.floor(Math.random() * 50) + 50;
      } else {
        // 15% - Max (100+)
        usageCount = Math.floor(Math.random() * 50) + 100;
      }

      // Update usage count
      await sql`
        UPDATE user_quotas
        SET monthly_count = ${usageCount}
        WHERE user_id = ${user.id}
      `;

      // Create generated documents for activated users (usage > 0)
      if (usageCount > 0) {
        const firstGenTime = addHours(user.email_verified_at, Math.random() * 12 + 1); // 1-13 hours after verification

        await sql`
          INSERT INTO generated_documents (
            user_id, filename, language, file_size_bytes,
            documentation, quality_score, doc_type,
            origin, provider, model,
            generated_at, created_at
          )
          VALUES (
            ${user.id},
            'app.js',
            'javascript',
            2500,
            '# Test Documentation\n\nGenerated for test user.',
            '{"score": 85, "grade": "B", "breakdown": {}}'::jsonb,
            'README',
            'upload',
            'claude',
            'claude-sonnet-4-5-20250929',
            ${firstGenTime},
            ${firstGenTime}
          )
        `;
      }
    }

    console.log('   ✓ Created usage patterns for all users\n');

    // Step 4: Summary
    console.log('📈 Trial Program Seed Summary:\n');

    const campaignTrialsWinter = await sql`
      SELECT COUNT(*) as count,
             COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions
      FROM user_trials
      WHERE trial_program_id = ${campaign1.rows[0].id}
    `;

    const campaignTrialsPartner = await sql`
      SELECT COUNT(*) as count,
             COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions
      FROM user_trials
      WHERE trial_program_id = ${campaign2.rows[0].id}
    `;

    const individualTrials = await sql`
      SELECT COUNT(*) as count,
             COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions
      FROM user_trials
      WHERE source = 'self_serve'
    `;

    const usageSegments = await sql`
      SELECT
        CASE
          WHEN monthly_count = 0 THEN 'No Usage'
          WHEN monthly_count BETWEEN 1 AND 9 THEN 'Light (1-9)'
          WHEN monthly_count BETWEEN 10 AND 49 THEN 'Engaged (10-49)'
          WHEN monthly_count BETWEEN 50 AND 99 THEN 'Power (50-99)'
          WHEN monthly_count >= 100 THEN 'Max (100+)'
        END as segment,
        COUNT(*) as users
      FROM user_quotas uq
      JOIN users u ON uq.user_id = u.id
      WHERE u.created_at >= ${startDate}
        AND u.created_at < ${endDate}
      GROUP BY 1
      ORDER BY 1
    `;

    console.log('Trial Program Trials (Winter Launch Trial Program):');
    console.log(`   Trials: ${campaignTrialsWinter.rows[0].count}`);
    console.log(`   Conversions: ${campaignTrialsWinter.rows[0].conversions}`);
    console.log(`   Rate: ${((campaignTrialsWinter.rows[0].conversions / campaignTrialsWinter.rows[0].count) * 100).toFixed(1)}%\n`);

    console.log('Trial Program Trials (Partner Program):');
    console.log(`   Trials: ${campaignTrialsPartner.rows[0].count}`);
    console.log(`   Conversions: ${campaignTrialsPartner.rows[0].conversions}`);
    console.log(`   Rate: ${((campaignTrialsPartner.rows[0].conversions / campaignTrialsPartner.rows[0].count) * 100).toFixed(1)}%\n`);

    console.log('Individual Trials:');
    console.log(`   Trials: ${individualTrials.rows[0].count}`);
    console.log(`   Conversions: ${individualTrials.rows[0].conversions}`);
    console.log(`   Rate: ${((individualTrials.rows[0].conversions / individualTrials.rows[0].count) * 100).toFixed(1)}%\n`);

    console.log('Usage Segments:');
    usageSegments.rows.forEach(seg => {
      console.log(`   ${seg.segment}: ${seg.users} users`);
    });

    console.log('\n✅ Trial Program seed complete!\n');
    console.log('📝 Test with Google Sheets:');
    console.log(`   Start Date: ${startDate.toISOString().split('T')[0]}`);
    console.log(`   End Date: ${endDate.toISOString().split('T')[0]}`);
    console.log(`   Trial Program Source: auto_campaign\n`);

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    process.exit(0);
  }
};

// Run seed
seedCampaigns();
