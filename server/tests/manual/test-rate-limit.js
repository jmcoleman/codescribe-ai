/**
 * Rate Limiting Test Suite for CodeScribe AI
 *
 * Tests:
 * 1. Basic rate limiting (10 req/min)
 * 2. Rate limit headers presence
 * 3. 429 response format
 * 4. Multiple endpoints rate limiting (/generate)
 * 5. Health endpoint (should NOT be rate limited)
 *
 * IMPORTANT NOTES:
 * - Test 2 waits 60 seconds to reset the rate limit window
 * - This means Test 4 will have a fresh rate limit window
 * - Test 4 checks if the /generate endpoint has limiters applied
 * - Since both apiLimiter (10/min) and generationLimiter (100/hour) are applied,
 *   Test 4 may pass with all 12 requests if the window just reset
 * - To test properly, run tests multiple times in succession
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(60));
  log(`🧪 TEST: ${testName}`, 'cyan');
  console.log('='.repeat(60));
}

function logPass(message) {
  log(`✅ PASS: ${message}`, 'green');
}

function logFail(message) {
  log(`❌ FAIL: ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

function logWarn(message) {
  log(`⚠️  WARN: ${message}`, 'yellow');
}

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Basic Rate Limiting (10 req/min)
async function testBasicRateLimit() {
  logTest('Basic Rate Limiting (10 requests per minute)');

  let successCount = 0;
  let rateLimitCount = 0;

  const testCode = 'function test() { return true; }';

  logInfo('Sending 12 requests rapidly...');

  for (let i = 1; i <= 12; i++) {
    try {
      const response = await fetch(`${API_URL}/generate-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: testCode,
          docType: 'README',
          language: 'javascript'
        })
      });

      if (response.status === 200) {
        successCount++;
        log(`  Request ${i}: ${response.status} OK`, 'gray');
      } else if (response.status === 429) {
        rateLimitCount++;
        log(`  Request ${i}: ${response.status} RATE LIMITED`, 'yellow');
      } else {
        log(`  Request ${i}: ${response.status} UNEXPECTED`, 'red');
      }
    } catch (error) {
      logFail(`Request ${i} failed: ${error.message}`);
    }
  }

  console.log();
  logInfo(`Success: ${successCount}, Rate Limited: ${rateLimitCount}`);

  if (successCount === 10 && rateLimitCount === 2) {
    logPass('Rate limiting working correctly (10 succeeded, 2 blocked)');
    return true;
  } else if (successCount <= 10 && rateLimitCount >= 2) {
    logPass('Rate limiting is working (may have overlapping windows)');
    return true;
  } else {
    logFail(`Expected 10 success and 2 rate limited, got ${successCount} success and ${rateLimitCount} rate limited`);
    return false;
  }
}

// Test 2: Rate Limit Headers
async function testRateLimitHeaders() {
  logTest('Rate Limit Headers Presence');

  logInfo('Waiting 60 seconds for rate limit window to reset...');
  await wait(61000);

  logInfo('Sending test request...');

  try {
    const response = await fetch(`${API_URL}/generate-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'function test() { return true; }',
        docType: 'README'
      })
    });

    const remaining = response.headers.get('X-RateLimit-Remaining');
    const limit = response.headers.get('X-RateLimit-Limit');
    const reset = response.headers.get('X-RateLimit-Reset');

    console.log();
    logInfo(`X-RateLimit-Limit: ${limit}`);
    logInfo(`X-RateLimit-Remaining: ${remaining}`);
    logInfo(`X-RateLimit-Reset: ${reset}`);

    if (limit && remaining !== null) {
      logPass('Rate limit headers present');

      if (limit === '10') {
        logPass('Rate limit set to 10 requests per window');
      } else {
        logWarn(`Expected limit of 10, got ${limit}`);
      }

      if (parseInt(remaining) === 9) {
        logPass('Remaining count correctly decremented');
      } else {
        logWarn(`Expected remaining of 9, got ${remaining}`);
      }

      return true;
    } else {
      logFail('Rate limit headers missing');
      return false;
    }
  } catch (error) {
    logFail(`Request failed: ${error.message}`);
    return false;
  }
}

// Test 3: 429 Response Format
async function test429ResponseFormat() {
  logTest('429 Response Format');

  logInfo('Triggering rate limit by sending 11 requests...');

  const testCode = 'function test() { return true; }';
  let response429;

  // Send 11 requests to trigger rate limit
  for (let i = 1; i <= 11; i++) {
    const response = await fetch(`${API_URL}/generate-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCode, docType: 'README' })
    });

    if (response.status === 429) {
      response429 = response;
      log(`  Request ${i}: Got 429 response`, 'yellow');
      break;
    }
  }

  if (!response429) {
    logFail('Could not trigger 429 response');
    return false;
  }

  try {
    const data = await response429.json();

    console.log();
    logInfo('429 Response Body:');
    console.log(JSON.stringify(data, null, 2));

    const hasError = data.error !== undefined;
    const hasMessage = data.message !== undefined;
    const hasRetryAfter = data.retryAfter !== undefined;

    console.log();
    if (hasError) {
      logPass(`Has 'error' field: ${data.error}`);
    } else {
      logFail('Missing \'error\' field');
    }

    if (hasMessage) {
      logPass(`Has 'message' field: ${data.message}`);
    } else {
      logFail('Missing \'message\' field');
    }

    if (hasRetryAfter) {
      logPass(`Has 'retryAfter' field: ${data.retryAfter}`);
    } else {
      logWarn('Missing \'retryAfter\' field (optional but recommended)');
    }

    return hasError && hasMessage;
  } catch (error) {
    logFail(`Failed to parse 429 response: ${error.message}`);
    return false;
  }
}

// Test 4: Multiple Endpoints
async function testMultipleEndpoints() {
  logTest('Rate Limiting Across Multiple Endpoints');

  logInfo('Testing /generate endpoint (without waiting - testing immediate rate limit)...');
  logWarn('Note: This test does NOT wait 60s, so it tests the current rate limit state');

  const testCode = 'function test() { return true; }';
  let generateSuccess = 0;
  let generateRateLimited = 0;

  // Send requests immediately to test if rate limiting is active
  for (let i = 1; i <= 12; i++) {
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCode, docType: 'README' })
    });

    if (response.status === 200) {
      generateSuccess++;
    } else if (response.status === 429) {
      generateRateLimited++;
    }
  }

  console.log();
  logInfo(`/generate - Success: ${generateSuccess}, Rate Limited: ${generateRateLimited}`);

  // More lenient check - if ANY requests are rate limited, it's working
  if (generateRateLimited > 0) {
    logPass('/generate endpoint is rate limited (some requests blocked)');
    return true;
  } else if (generateSuccess === 12) {
    logWarn('/generate endpoint allowed all 12 requests');
    logInfo('This may be OK if rate limit window reset. Check that limiters are applied to route.');
    // Check if this is expected due to fresh window
    logInfo('Tip: Run tests closer together to avoid window resets');
    return false;
  } else {
    logFail('/generate endpoint rate limiting may not be working correctly');
    return false;
  }
}

// Test 5: Health Endpoint (Should NOT be rate limited)
async function testHealthEndpoint() {
  logTest('Health Endpoint (Should NOT be Rate Limited)');

  logInfo('Sending 15 requests to /health endpoint...');

  let allSuccess = true;

  for (let i = 1; i <= 15; i++) {
    const response = await fetch(`${API_URL}/health`);

    if (response.status !== 200) {
      logFail(`Request ${i}: Got status ${response.status}`);
      allSuccess = false;
    }
  }

  if (allSuccess) {
    logPass('Health endpoint is NOT rate limited (all 15 requests succeeded)');
    return true;
  } else {
    logFail('Health endpoint may be incorrectly rate limited');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.clear();
  log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║     CodeScribe AI - Rate Limiting Test Suite           ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝', 'cyan');

  logInfo(`Testing API at: ${API_URL}`);
  logInfo('Make sure the server is running: npm run dev\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Run tests
  const tests = [
    { name: 'Basic Rate Limiting', fn: testBasicRateLimit },
    { name: 'Rate Limit Headers', fn: testRateLimitHeaders },
    { name: '429 Response Format', fn: test429ResponseFormat },
    { name: 'Multiple Endpoints', fn: testMultipleEndpoints },
    { name: 'Health Endpoint', fn: testHealthEndpoint }
  ];

  for (const test of tests) {
    results.total++;
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      logFail(`Test "${test.name}" crashed: ${error.message}`);
      results.failed++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  log('📊 TEST SUMMARY', 'cyan');
  console.log('='.repeat(60));

  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  console.log();
  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED!', 'green');
  } else {
    log(`⚠️  ${results.failed} TEST(S) FAILED`, 'red');
  }

  console.log('\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
