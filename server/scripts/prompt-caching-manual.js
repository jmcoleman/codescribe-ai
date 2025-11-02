/**
 * Simple test script to verify prompt caching is working
 * Run with: node server/tests/prompt-caching.test.js
 */

import docGenerator from '../src/services/docGenerator.js';

const testCode = `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`;

console.log('🧪 Testing prompt caching implementation...\n');

// Test 1: First generation (should create cache)
console.log('📝 Test 1: First generation (cache creation)');
console.log('Expected: cache_creation_input_tokens > 0');
try {
  const result1 = await docGenerator.generateDocumentation(testCode, {
    docType: 'README',
    language: 'javascript',
    streaming: false,
    isDefaultCode: true
  });
  console.log('✅ Test 1 passed - Documentation generated');
  console.log(`   Metadata: ${JSON.stringify(result1.metadata, null, 2)}`);
} catch (error) {
  console.error('❌ Test 1 failed:', error.message);
}

console.log('\n⏱️  Waiting 2 seconds before second generation...\n');
await new Promise(resolve => setTimeout(resolve, 2000));

// Test 2: Second generation with same code (should use cache)
console.log('📝 Test 2: Second generation (cache hit)');
console.log('Expected: cache_read_input_tokens > 0');
try {
  const result2 = await docGenerator.generateDocumentation(testCode, {
    docType: 'README',
    language: 'javascript',
    streaming: false,
    isDefaultCode: true
  });
  console.log('✅ Test 2 passed - Documentation generated');
  console.log(`   Metadata: ${JSON.stringify(result2.metadata, null, 2)}`);
} catch (error) {
  console.error('❌ Test 2 failed:', error.message);
}

// Test 3: Generation with different code (no cache for user message)
console.log('\n📝 Test 3: Different code (cache system prompt only)');
const differentCode = `function add(a, b) { return a + b; }`;
try {
  const result3 = await docGenerator.generateDocumentation(differentCode, {
    docType: 'README',
    language: 'javascript',
    streaming: false,
    isDefaultCode: false  // Not default code
  });
  console.log('✅ Test 3 passed - Documentation generated');
  console.log(`   Metadata: ${JSON.stringify(result3.metadata, null, 2)}`);
} catch (error) {
  console.error('❌ Test 3 failed:', error.message);
}

console.log('\n✨ Prompt caching tests complete!');
console.log('\n📊 Summary:');
console.log('- Test 1: Should show cache_creation_input_tokens in logs');
console.log('- Test 2: Should show cache_read_input_tokens in logs (90% cost savings!)');
console.log('- Test 3: Should show cache_read_input_tokens for system prompt only');
console.log('\nCheck the console output above for [ClaudeClient] Cache stats logs');
