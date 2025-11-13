import { codeSamples } from '../data/examples';

/**
 * Default code shown when the app loads
 * This value is used to enable prompt caching for cost optimization
 */
export const DEFAULT_CODE = '// Paste your code here or try the example below...\n\n// Example function:\nfunction calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n';

/**
 * Example code library for caching optimization
 * Each example code is cached for 1 hour with auto-refresh
 * When users load these examples, they benefit from 90% cost reduction
 *
 * IMPORTANT: Code must match EXACTLY (including whitespace) to hit cache
 * Source: client/src/data/examples.js
 *
 * How it works:
 * - User 1 loads C# sample (2:00 PM) → Cache created, expires 3:00 PM
 * - User 2 loads C# sample (2:30 PM) → Uses cache (90% off!), expires 3:30 PM
 * - User 3 loads C# sample (3:15 PM) → Uses cache (90% off!), expires 4:15 PM
 * - Cache stays warm with 1+ user/hour trying same sample
 */
export const EXAMPLE_CODES = new Set(codeSamples.map(sample => sample.code));
