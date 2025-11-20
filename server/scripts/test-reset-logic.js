// Test the reset logic with the actual database values

const lastResetDateStr = "2025-11-07T23:31:20.695Z";
const lastResetDate = new Date(lastResetDateStr);
console.log('Original last_reset_date:', lastResetDate);
console.log('ISO:', lastResetDate.toISOString());

// Set to midnight (what the code does)
lastResetDate.setHours(0, 0, 0, 0);
console.log('\nAfter setHours(0,0,0,0):', lastResetDate);
console.log('ISO:', lastResetDate.toISOString());
console.log('getTime():', lastResetDate.getTime());

// Calculate today
const today = new Date();
today.setHours(0, 0, 0, 0);
console.log('\nToday:', today);
console.log('ISO:', today.toISOString());
console.log('getTime():', today.getTime());

// Check comparison
console.log('\nComparison:');
console.log('today > lastResetDate:', today.getTime() > lastResetDate.getTime());
console.log('Difference (ms):', today.getTime() - lastResetDate.getTime());
console.log('Difference (hours):', (today.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60));
