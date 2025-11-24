#!/usr/bin/env node
/**
 * Check LLM Metadata for Generated Documents
 * Usage: node scripts/check-llm-usage.js [email]
 *
 * Shows which LLM provider and model was used for recent document generations
 */

import 'dotenv/config';
import { sql } from '@vercel/postgres';

const userEmail = process.argv[2];

async function checkLLMUsage() {
  try {
    let query;

    if (userEmail) {
      // Check for specific user
      console.log(`\n🔍 Checking LLM usage for user: ${userEmail}\n`);
      query = sql`
        SELECT
          filename,
          doc_type,
          provider,
          model,
          input_tokens,
          output_tokens,
          was_cached,
          latency_ms,
          generated_at
        FROM generated_documents
        WHERE user_id = (SELECT id FROM users WHERE email = ${userEmail})
          AND deleted_at IS NULL
        ORDER BY generated_at DESC
        LIMIT 20
      `;
    } else {
      // Check all recent documents
      console.log('\n🔍 Checking recent LLM usage (all users)\n');
      query = sql`
        SELECT
          gd.filename,
          gd.doc_type,
          gd.provider,
          gd.model,
          gd.input_tokens,
          gd.output_tokens,
          gd.was_cached,
          gd.latency_ms,
          gd.generated_at,
          u.email
        FROM generated_documents gd
        JOIN users u ON gd.user_id = u.id
        WHERE gd.deleted_at IS NULL
        ORDER BY gd.generated_at DESC
        LIMIT 20
      `;
    }

    const result = await query;

    if (result.rows.length === 0) {
      console.log('❌ No documents found');
      process.exit(0);
    }

    console.log(`Found ${result.rows.length} document(s):\n`);
    console.log('─'.repeat(120));

    result.rows.forEach((row, index) => {
      const cached = row.was_cached ? '💾 CACHED' : '';
      const latency = row.latency_ms ? `${(row.latency_ms / 1000).toFixed(2)}s` : 'N/A';

      console.log(`${index + 1}. ${row.filename} (${row.doc_type})`);
      if (row.email) {
        console.log(`   User: ${row.email}`);
      }
      console.log(`   🤖 LLM: ${row.provider} / ${row.model} ${cached}`);
      console.log(`   📊 Tokens: ${row.input_tokens || '?'} in → ${row.output_tokens || '?'} out`);
      console.log(`   ⏱️  Latency: ${latency}`);
      console.log(`   📅 Generated: ${new Date(row.generated_at).toLocaleString()}`);
      console.log('─'.repeat(120));
    });

    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkLLMUsage();
