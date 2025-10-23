// ========================================
// VERCEL ANALYTICS DIAGNOSTIC SCRIPT
// ========================================
// HOW TO USE:
// 1. Open https://codescribeai.com in your browser
// 2. Open DevTools (F12 or Right-click → Inspect)
// 3. Click on Console tab
// 4. Copy and paste this entire file into the console
// 5. Press Enter
// 6. Share the output with me

console.log('🔍 VERCEL ANALYTICS DIAGNOSTIC REPORT');
console.log('=====================================\n');

// Test 1: Check Environment
console.log('1️⃣ ENVIRONMENT CHECK:');
console.log('   Current URL:', window.location.href);
console.log('   Hostname:', window.location.hostname);
console.log('   Protocol:', window.location.protocol);

// Test 2: Check if running in production mode
console.log('\n2️⃣ VITE ENVIRONMENT:');
console.log('   ℹ️  Cannot check import.meta.env from browser console');
console.log('   ℹ️  This is normal - it only works in the compiled app code');

// Test 3: Check if Vercel Analytics is loaded
console.log('\n3️⃣ ANALYTICS COMPONENTS:');
console.log('   window.__VERCEL_ANALYTICS__:', typeof window.__VERCEL_ANALYTICS__);
if (window.__VERCEL_ANALYTICS__) {
  console.log('   ✅ Analytics component loaded');
  console.log('   Analytics object:', window.__VERCEL_ANALYTICS__);
} else {
  console.log('   ❌ Analytics component NOT loaded');
  console.log('   ⚠️  This means <Analytics /> is not rendering!');
}

// Test 4: Check if Speed Insights is loaded
console.log('\n4️⃣ SPEED INSIGHTS:');
console.log('   window.webVitals:', typeof window.webVitals);
console.log('   window.__VERCEL_SPEED_INSIGHTS__:', typeof window.__VERCEL_SPEED_INSIGHTS__);
if (window.__VERCEL_SPEED_INSIGHTS__) {
  console.log('   ✅ Speed Insights loaded');
  console.log('   Speed Insights object:', window.__VERCEL_SPEED_INSIGHTS__);
} else {
  console.log('   ❌ Speed Insights NOT loaded');
  console.log('   ⚠️  This means <SpeedInsights /> is not rendering!');
}

// Test 5: Check for analytics scripts in DOM
console.log('\n5️⃣ ANALYTICS SCRIPTS IN DOM:');
const scripts = Array.from(document.querySelectorAll('script'));
const analyticsScripts = scripts.filter(s =>
  s.src.includes('vercel') ||
  s.src.includes('analytics') ||
  s.src.includes('vitals')
);
if (analyticsScripts.length > 0) {
  console.log('   ✅ Found', analyticsScripts.length, 'Vercel script(s):');
  analyticsScripts.forEach(s => console.log('      -', s.src));
} else {
  console.log('   ❌ No Vercel analytics scripts found in DOM');
  console.log('   ⚠️  Components are not loading the scripts!');
}

// Test 6: Check React root
console.log('\n6️⃣ REACT ROOT:');
const root = document.getElementById('root');
if (root && root._reactRootContainer) {
  console.log('   ✅ React root found (legacy method)');
} else if (root) {
  console.log('   ✅ Root div found (React 18+ - expected)');
  console.log('   ℹ️  React 18+ doesn\'t expose _reactRootContainer, this is normal');
} else {
  console.log('   ❌ React root not found');
}

// Test 7: Check for Vercel environment indicators
console.log('\n7️⃣ VERCEL ENVIRONMENT INDICATORS:');
const metaTags = Array.from(document.querySelectorAll('meta'));
const vercelMeta = metaTags.filter(m =>
  m.name?.includes('vercel') ||
  m.content?.includes('vercel')
);
if (vercelMeta.length > 0) {
  console.log('   ✅ Vercel deployment meta tags found:');
  vercelMeta.forEach(m => console.log('      -', m.name || m.property, ':', m.content));
} else {
  console.log('   ⚠️  No Vercel meta tags (not necessarily a problem)');
}

// Test 8: Instructions for Network tab
console.log('\n8️⃣ NETWORK TAB CHECK (MANUAL):');
console.log('   Now check your Network tab:');
console.log('   1. Open Network tab in DevTools');
console.log('   2. Filter by "vercel"');
console.log('   3. Reload the page');
console.log('   4. Look for these requests:');
console.log('      - va.vercel-scripts.com/v1/script.debug.js (Analytics)');
console.log('      - vitals.vercel-insights.com/v1/vitals (Speed Insights)');
console.log('   5. Both should show Status: 200 OK');

// Test 9: Check for console errors
console.log('\n9️⃣ CONSOLE ERRORS:');
console.log('   Scroll up in console and look for any RED errors mentioning:');
console.log('   - @vercel/analytics');
console.log('   - @vercel/speed-insights');
console.log('   - Failed to load');

console.log('\n=====================================');
console.log('📋 DIAGNOSTIC SUMMARY:');
console.log('=====================================');

// Create summary object
const summary = {
  url: window.location.href,
  hostname: window.location.hostname,
  analyticsLoaded: !!window.__VERCEL_ANALYTICS__,
  speedInsightsLoaded: !!window.__VERCEL_SPEED_INSIGHTS__,
  scriptsFound: analyticsScripts.length,
  scriptURLs: analyticsScripts.map(s => s.src),
  diagnosis: ''
};

// Diagnosis
if (!summary.analyticsLoaded && !summary.speedInsightsLoaded) {
  summary.diagnosis = '❌ CRITICAL: Neither Analytics nor Speed Insights are loading. Components are not rendering.';
  console.log('❌ CRITICAL ISSUE: Neither Analytics nor Speed Insights are loading!');
  console.log('   This means the components are NOT rendering in your app.');
  console.log('   Possible causes:');
  console.log('   1. import.meta.env.MODE !== "production" (most likely)');
  console.log('   2. Build issue - components not included in production build');
  console.log('   3. Speed Insights not enabled in Vercel Dashboard');
} else if (!summary.analyticsLoaded) {
  summary.diagnosis = '⚠️  Analytics not loading, but Speed Insights is working';
  console.log('⚠️  Analytics NOT loading (but Speed Insights is)');
} else if (!summary.speedInsightsLoaded) {
  summary.diagnosis = '⚠️  Speed Insights not loading, but Analytics is working';
  console.log('⚠️  Speed Insights NOT loading (but Analytics is)');
} else {
  summary.diagnosis = '✅ Both Analytics and Speed Insights are loaded successfully!';
  console.log('✅ SUCCESS: Both Analytics and Speed Insights are loaded!');
  console.log('   Data should appear in Vercel Dashboard within 5-10 minutes.');
}

console.log('\n📊 Summary Object:');
console.table(summary);

console.log('\n=====================================');
console.log('📤 NEXT STEPS:');
console.log('=====================================');
console.log('1. Take a screenshot of this console output');
console.log('2. Share the summary object above');
console.log('3. Check Network tab as instructed in step 8');
console.log('4. Report back what you see!');
console.log('=====================================\n');

// Return summary for easy copying
summary;
