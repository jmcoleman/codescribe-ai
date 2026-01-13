/**
 * Seed Analytics Data Script
 *
 * Populates the analytics_events table with realistic test data to verify:
 * 1. Code input tracking (5 origins: default, upload, github, sample, paste)
 * 2. Generation funnel (code_input → generation_started → generation_completed)
 * 3. Usage patterns dashboard
 *
 * Usage: node server/src/scripts/seedAnalytics.js
 */

import { sql } from '@vercel/postgres';

// Helper to generate random session ID
const generateSessionId = () => {
  return `session_${Math.random().toString(36).substring(2, 15)}`;
};

// Helper to get LLM provider (80% Claude, 20% OpenAI)
const getLLMProvider = () => {
  const rand = Math.random();
  if (rand < 0.8) {
    return {
      provider: 'claude',
      model: 'claude-sonnet-4-5-20250929'
    };
  } else {
    return {
      provider: 'openai',
      model: 'gpt-4o'
    };
  }
};

// Helper to generate random timestamp within current period
// Matches DateRangePicker "Last 7 days" preset: 7 days ago through tomorrow (8 days)
const randomTimestamp = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const randomTime = sevenDaysAgo.getTime() + Math.random() * (tomorrow.getTime() - sevenDaysAgo.getTime());
  return new Date(randomTime);
};

// Helper to generate random timestamp within prior period (8 days before current period)
const randomTimestampPriorPeriod = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fifteenDaysAgo = new Date(today);
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const randomTime = fifteenDaysAgo.getTime() + Math.random() * (sevenDaysAgo.getTime() - fifteenDaysAgo.getTime());
  return new Date(randomTime);
};

// Helper to insert analytics event
const insertEvent = async (eventName, eventCategory, sessionId, eventData, userId = null, createdAt = new Date()) => {
  await sql`
    INSERT INTO analytics_events (event_name, event_category, session_id, user_id, event_data, created_at)
    VALUES (${eventName}, ${eventCategory}, ${sessionId}, ${userId}, ${eventData}, ${createdAt})
  `;
};

// Helper function to create session funnels for a given period
const createSessionFunnels = async (getTimestamp, periodLabel) => {
  console.log(`\n📅 Creating sessions for ${periodLabel}...\n`);

  // Scenario 1: Default code (5 sessions - complete funnel)
  console.log('📝 Scenario 1: Default code (5 sessions)');
  for (let i = 0; i < 5; i++) {
    const sessionId = generateSessionId();
    const timestamp = getTimestamp();
    const llm = getLLMProvider(); // Get LLM provider for this session

    // Session start
    await insertEvent('session_start', 'workflow', sessionId, {}, null, timestamp);

    // Code input
    const codeInputTime = new Date(timestamp.getTime() + 500);
    await insertEvent('code_input', 'workflow', sessionId, {
      origin: 'default',
      codeLength: 500,
      language: 'javascript',
      filename: 'code.js'
    }, null, codeInputTime);

    // Generation started
    const genStartTime = new Date(codeInputTime.getTime() + 1000);
    await insertEvent('generation_started', 'workflow', sessionId, {
      docType: 'README',
      language: 'javascript',
      codeLength: 500,
      isStreaming: true
    }, null, genStartTime);

    // Generation completed
    const genCompleteTime = new Date(genStartTime.getTime() + 3000);
    await insertEvent('doc_generation', 'workflow', sessionId, {
      doc_type: 'README',
      success: 'true',
      duration_ms: 3000,
      code_input: {
        filename: 'code.js',
        language: 'javascript',
        origin: 'default',
        size_kb: 0  // 500 bytes / 1024
      },
      llm: llm
    }, null, genCompleteTime);

    // Quality score
    const qualityScoreTime = new Date(genCompleteTime.getTime() + 500);
    await insertEvent('quality_score', 'workflow', sessionId, {
      score: 85,
      grade: 'B',
      doc_type: 'README',
      score_range: '80-89',
      llm: llm
    }, null, qualityScoreTime);

    // Doc export (copy or download)
    const exportTime = new Date(qualityScoreTime.getTime() + 1500);
    await insertEvent('doc_export', 'workflow', sessionId, {
      action: i % 2 === 0 ? 'copy' : 'download',
      source: 'fresh',  // Fresh generation (not cached)
      doc_type: 'README',
      format: 'md'
    }, null, exportTime);
  }
  console.log('✅ Created 5 sessions with default code (complete funnel)\n');

    // Scenario 2: File upload (3 sessions - complete funnel)
    console.log('📤 Scenario 2: File upload (3 sessions)');
    for (let i = 0; i < 3; i++) {
      const sessionId = generateSessionId();
      const timestamp = getTimestamp();
      const llm = getLLMProvider();

      // Session start
      await insertEvent('session_start', 'workflow', sessionId, {}, null, timestamp);

      // Code input
      const codeInputTime = new Date(timestamp.getTime() + 500);
      await insertEvent('code_input', 'workflow', sessionId, {
        origin: 'upload',
        codeLength: 1200,
        language: 'python',
        filename: 'script.py',
        fileType: 'py',
        fileSize: 2400
      }, null, codeInputTime);

      // Generation started
      const genStartTime = new Date(codeInputTime.getTime() + 1000);
      await insertEvent('generation_started', 'workflow', sessionId, {
        docType: 'README',
        language: 'python',
        codeLength: 1200,
        isStreaming: true
      }, null, genStartTime);

      // Generation completed
      const genCompleteTime = new Date(genStartTime.getTime() + 4000);
      await insertEvent('doc_generation', 'workflow', sessionId, {
        doc_type: 'README',
        success: 'true',
        duration_ms: 4000,
        code_input: {
          filename: 'script.py',
          language: 'python',
          origin: 'upload',
          size_kb: 1  // 1200 bytes / 1024
        },
        llm: llm
      }, null, genCompleteTime);

      // Quality score
      const qualityScoreTime = new Date(genCompleteTime.getTime() + 500);
      await insertEvent('quality_score', 'workflow', sessionId, {
        score: 78,
        grade: 'C',
        doc_type: 'README',
        score_range: '70-79',
        llm: llm
      }, null, qualityScoreTime);

      // Doc export
      const exportTime = new Date(qualityScoreTime.getTime() + 1000);
      await insertEvent('doc_export', 'workflow', sessionId, {
        action: 'download',
        source: 'fresh',  // Fresh generation (not cached)
        doc_type: 'README',
        format: 'md'
      }, null, exportTime);
    }
    console.log('✅ Created 3 sessions with file upload (complete funnel)\n');

    // Scenario 3: GitHub import (2 sessions - complete funnel)
    console.log('🐙 Scenario 3: GitHub import (2 sessions)');
    for (let i = 0; i < 2; i++) {
      const sessionId = generateSessionId();
      const timestamp = getTimestamp();
      const llm = getLLMProvider();

      // Session start
      await insertEvent('session_start', 'workflow', sessionId, {}, null, timestamp);

      // Code input
      const codeInputTime = new Date(timestamp.getTime() + 500);
      await insertEvent('code_input', 'workflow', sessionId, {
        origin: 'github',
        codeLength: 2400,
        language: 'typescript',
        filename: 'component.tsx',
        owner: 'test-user',
        name: 'test-repo',
        path: 'src/component.tsx',
        isPrivate: false
      }, null, codeInputTime);

      // Generation started
      const genStartTime = new Date(codeInputTime.getTime() + 1000);
      await insertEvent('generation_started', 'workflow', sessionId, {
        docType: 'JSDOC',
        language: 'typescript',
        codeLength: 2400,
        isStreaming: true
      }, null, genStartTime);

      // Generation completed
      const genCompleteTime = new Date(genStartTime.getTime() + 5000);
      await insertEvent('doc_generation', 'workflow', sessionId, {
        doc_type: 'JSDOC',
        success: 'true',
        duration_ms: 5000,
        code_input: {
          filename: 'component.tsx',
          language: 'typescript',
          origin: 'github',
          size_kb: 2  // 2400 bytes / 1024
        },
        llm: llm
      }, null, genCompleteTime);

      // Quality score
      const qualityScoreTime = new Date(genCompleteTime.getTime() + 500);
      await insertEvent('quality_score', 'workflow', sessionId, {
        score: 92,
        grade: 'A',
        doc_type: 'JSDOC',
        score_range: '90-100',
        llm: llm
      }, null, qualityScoreTime);

      // Doc export
      const exportTime = new Date(qualityScoreTime.getTime() + 500);
      await insertEvent('doc_export', 'workflow', sessionId, {
        action: 'copy',
        source: 'fresh',  // Fresh generation (not cached)
        doc_type: 'JSDOC',
        format: 'md'
      }, null, exportTime);
    }
    console.log('✅ Created 2 sessions with GitHub import (complete funnel)\n');

    // Scenario 4: Sample code (4 sessions - complete funnel)
    console.log('📋 Scenario 4: Sample code (4 sessions)');
    for (let i = 0; i < 4; i++) {
      const sessionId = generateSessionId();
      const timestamp = getTimestamp();
      const llm = getLLMProvider();

      // Session start
      await insertEvent('session_start', 'workflow', sessionId, {}, null, timestamp);

      // Code input
      const codeInputTime = new Date(timestamp.getTime() + 500);
      await insertEvent('code_input', 'workflow', sessionId, {
        origin: 'sample',
        codeLength: 800,
        language: 'javascript',
        filename: 'example.js'
      }, null, codeInputTime);

      // Generation started
      const genStartTime = new Date(codeInputTime.getTime() + 1000);
      await insertEvent('generation_started', 'workflow', sessionId, {
        docType: 'README',
        language: 'javascript',
        codeLength: 800,
        isStreaming: true
      }, null, genStartTime);

      // Generation completed
      const genCompleteTime = new Date(genStartTime.getTime() + 2500);
      await insertEvent('doc_generation', 'workflow', sessionId, {
        doc_type: 'README',
        success: 'true',
        duration_ms: 2500,
        code_input: {
          filename: 'example.js',
          language: 'javascript',
          origin: 'sample',
          size_kb: 1  // 800 bytes / 1024
        },
        llm: llm
      }, null, genCompleteTime);

      // Quality score
      const qualityScoreTime = new Date(genCompleteTime.getTime() + 500);
      await insertEvent('quality_score', 'workflow', sessionId, {
        score: 80,
        grade: 'B',
        doc_type: 'README',
        score_range: '80-89',
        llm: llm
      }, null, qualityScoreTime);

      // Doc export
      const exportTime = new Date(qualityScoreTime.getTime() + 700);
      await insertEvent('doc_export', 'workflow', sessionId, {
        action: i % 2 === 0 ? 'copy' : 'download',
        source: 'fresh',  // Fresh generation (not cached)
        doc_type: 'README',
        format: 'md'
      }, null, exportTime);
    }
    console.log('✅ Created 4 sessions with sample code (complete funnel)\n');

    // Scenario 5: Paste (6 sessions - complete funnel)
    console.log('📋 Scenario 5: Paste (6 sessions)');
    for (let i = 0; i < 6; i++) {
      const sessionId = generateSessionId();
      const timestamp = getTimestamp();
      const llm = getLLMProvider();

      // Session start
      await insertEvent('session_start', 'workflow', sessionId, {}, null, timestamp);

      // Code input
      const codeInputTime = new Date(timestamp.getTime() + 500);
      await insertEvent('code_input', 'workflow', sessionId, {
        origin: 'paste',
        codeLength: 1500,
        language: 'java',
        filename: 'Main.java'
      }, null, codeInputTime);

      // Generation started
      const genStartTime = new Date(codeInputTime.getTime() + 1000);
      await insertEvent('generation_started', 'workflow', sessionId, {
        docType: 'README',
        language: 'java',
        codeLength: 1500,
        isStreaming: true
      }, null, genStartTime);

      // Generation completed
      const genCompleteTime = new Date(genStartTime.getTime() + 3500);
      await insertEvent('doc_generation', 'workflow', sessionId, {
        doc_type: 'README',
        success: 'true',
        duration_ms: 3500,
        code_input: {
          filename: 'Main.java',
          language: 'java',
          origin: 'paste',
          size_kb: 1  // 1500 bytes / 1024
        },
        llm: llm
      }, null, genCompleteTime);

      // Quality score
      const qualityScoreTime = new Date(genCompleteTime.getTime() + 500);
      await insertEvent('quality_score', 'workflow', sessionId, {
        score: 88,
        grade: 'B',
        doc_type: 'README',
        score_range: '80-89',
        llm: llm
      }, null, qualityScoreTime);

      // Doc export
      const exportTime = new Date(qualityScoreTime.getTime() + 1300);
      await insertEvent('doc_export', 'workflow', sessionId, {
        action: 'download',
        source: 'fresh',  // Fresh generation (not cached)
        doc_type: 'README',
        format: 'md'
      }, null, exportTime);
    }
    console.log('✅ Created 6 sessions with paste (complete funnel)\n');

    // Scenario 6: Generation failures (2 sessions - incomplete funnel, drops at generation)
    console.log('❌ Scenario 6: Generation failures (2 sessions)');
    for (let i = 0; i < 2; i++) {
      const sessionId = generateSessionId();
      const timestamp = getTimestamp();
      const llm = getLLMProvider();

      // Session start
      await insertEvent('session_start', 'workflow', sessionId, {}, null, timestamp);

      // Code input
      const codeInputTime = new Date(timestamp.getTime() + 500);
      await insertEvent('code_input', 'workflow', sessionId, {
        origin: 'upload',
        codeLength: 500,
        language: 'python',
        filename: 'test.py'
      }, null, codeInputTime);

      // Generation started
      const genStartTime = new Date(codeInputTime.getTime() + 1000);
      await insertEvent('generation_started', 'workflow', sessionId, {
        docType: 'README',
        language: 'python',
        codeLength: 500,
        isStreaming: true
      }, null, genStartTime);

      // Generation FAILED (no doc_export after this)
      const genFailTime = new Date(genStartTime.getTime() + 1000);
      await insertEvent('doc_generation', 'workflow', sessionId, {
        doc_type: 'README',
        success: 'false',
        duration_ms: 1000,
        error: 'API rate limit exceeded',
        code_input: {
          filename: 'test.py',
          language: 'python',
          origin: 'upload',
          size_kb: 0  // 500 bytes / 1024
        },
        llm: llm
      }, null, genFailTime);
      // No quality_score or doc_export - user dropped off after failure
    }
    console.log('✅ Created 2 sessions with generation failures (incomplete funnel)\n');
};

const seedAnalytics = async () => {
  console.log('🌱 Seeding analytics data for current and prior periods...\n');

  try {
    // Create sessions for PRIOR period (15-7 days ago, matching 8-day window)
    await createSessionFunnels(randomTimestampPriorPeriod, 'PRIOR PERIOD (15-7 days ago)');

    // Create sessions for CURRENT period (last 7 days through tomorrow, matching DateRangePicker)
    await createSessionFunnels(randomTimestamp, 'CURRENT PERIOD (last 7 days through tomorrow)');

    // Summary
    console.log('\n📊 Summary:');
    console.log('   Total sessions per period: 22');
    console.log('   Total sessions across both periods: 44');
    console.log('   - Default: 5 sessions per period (complete funnel)');
    console.log('   - Upload: 5 sessions per period (3 complete, 2 failed at generation)');
    console.log('   - GitHub: 2 sessions per period (complete funnel)');
    console.log('   - Sample: 4 sessions per period (complete funnel)');
    console.log('   - Paste: 6 sessions per period (complete funnel)');
    console.log('   Total events per period: 130');
    console.log('   Total events across both periods: 260');
    console.log('');
    console.log('✅ Expected funnel counts (5 stages) per period:');
    console.log('   - Sessions Started: 22 sessions (100%)');
    console.log('   - Code Input: 22 sessions (100%)');
    console.log('   - Generation Started: 22 sessions (100%)');
    console.log('   - Generation Completed: 20 sessions (90.9% - 2 failures)');
    console.log('   - Copied/Downloaded: 20 sessions (100% of completed)');
    console.log('');
    console.log('✅ Expected usage patterns per period:');
    console.log('   Code Input Origins: Default (5), Upload (5), GitHub (2), Sample (4), Paste (6)');
    console.log('   Doc Types: README (18), JSDOC (2)');
    console.log('   Languages: JavaScript (9), Python (5), TypeScript (2), Java (6)');
    console.log('   Quality Scores: 90-100 (2), 80-89 (15), 70-79 (3)');
    console.log('   Export Sources: Fresh (20), Cached (0)');
    console.log('');
    console.log('🎉 Analytics seeding complete! Period-over-period comparisons will now work.\n');

  } catch (error) {
    console.error('❌ Error seeding analytics:', error);
    throw error;
  }
};

// Run seeding
seedAnalytics()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
