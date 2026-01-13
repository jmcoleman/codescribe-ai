#!/usr/bin/env node
/**
 * Roadmap Cleanup Script
 * Removes technical implementation details from roadmap-data.json
 * to keep features user-focused (per CLAUDE.md guidelines)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const roadmapPath = path.join(__dirname, '../docs/planning/roadmap/roadmap-data.json');
const backupPath = path.join(__dirname, '../docs/planning/roadmap/roadmap-data.backup.json');

// Patterns to remove (entire feature lines)
const REMOVE_PATTERNS = [
  // Test coverage stats
  /test coverage.*\d+.*tests/i,
  /\d+\s+tests.*\(\d+.*passing/i,
  /\d+\s+new tests/i,
  /services coverage:.*statements/i,
  /ci coverage thresholds/i,

  // Technical implementation details
  /database migration \d+:/i,
  /migration.*:.*updates check constraint/i,
  /added.*storage key/i,
  /implemented.*localStorage/i,
  /implemented.*sessionStorage/i,

  // Component/Service/File names in isolation
  /component:/i,
  /service:/i,
  /using .*(component|service|provider|context|hook|util|helper)/i,
  /file:/i,

  // SQL/Database internals
  /\b(sql|query|queries|table|column|index|constraint)\b.*implemented/i,
  /converted sql\.query/i,

  // Code patterns
  /\(.*\+.*AbortController\)/i,
  /(guard|flag|helper|utility|wrapper) (on|for|in)/i,

  // Generic "fixes" that are too technical
  /fixed.*tests to mock/i,
  /updated.*service tests/i,
];

// Patterns to simplify (text replacements)
const SIMPLIFY_PATTERNS = [
  // Remove technical details in parentheses
  { pattern: /\s*\([^)]*component[^)]*\)/gi, replacement: '' },
  { pattern: /\s*\([^)]*service[^)]*\)/gi, replacement: '' },
  { pattern: /\s*\([^)]*Context[^)]*\)/gi, replacement: '' },
  { pattern: /\s*\([^)]*localStorage[^)]*\)/gi, replacement: '' },
  { pattern: /\s*\([^)]*sessionStorage[^)]*\)/gi, replacement: '' },
  { pattern: /\s*\([^)]*TanStack[^)]*\)/gi, replacement: '' },
  { pattern: /\s*\([^)]*Recharts[^)]*\)/gi, replacement: '' },

  // Simplify technical phrases
  { pattern: /implemented /gi, replacement: '' },
  { pattern: /added backend /gi, replacement: 'Enhanced ' },
  { pattern: /updated .* to /gi, replacement: '' },
  { pattern: /migration.*: /gi, replacement: '' },

  // Remove technical suffixes
  { pattern: / \(.*\.js\)$/gi, replacement: '' },
  { pattern: / \(.*\.jsx\)$/gi, replacement: '' },
  { pattern: / in .*Service$/gi, replacement: '' },
  { pattern: / via .*Component$/gi, replacement: '' },
];

function shouldRemoveFeature(feature) {
  return REMOVE_PATTERNS.some(pattern => pattern.test(feature));
}

function simplifyFeature(feature) {
  let simplified = feature;

  SIMPLIFY_PATTERNS.forEach(({ pattern, replacement }) => {
    simplified = simplified.replace(pattern, replacement);
  });

  // Clean up double spaces and trim
  simplified = simplified.replace(/\s+/g, ' ').trim();

  // If simplification made it too short or empty, return original
  if (simplified.length < 10) {
    return feature;
  }

  return simplified;
}

function cleanPhase(phase) {
  if (!phase.features || !Array.isArray(phase.features)) {
    return phase;
  }

  // Filter out features matching removal patterns
  let cleanedFeatures = phase.features.filter(feature => !shouldRemoveFeature(feature));

  // Simplify remaining features
  cleanedFeatures = cleanedFeatures.map(feature => simplifyFeature(feature));

  // Remove duplicates
  cleanedFeatures = [...new Set(cleanedFeatures)];

  return {
    ...phase,
    features: cleanedFeatures
  };
}

function cleanRoadmap(data) {
  const cleaned = { ...data };

  if (cleaned.columns && Array.isArray(cleaned.columns)) {
    cleaned.columns = cleaned.columns.map(column => {
      if (column.phases && Array.isArray(column.phases)) {
        return {
          ...column,
          phases: column.phases.map(phase => cleanPhase(phase))
        };
      }
      return column;
    });
  }

  return cleaned;
}

function main() {
  console.log('🧹 Roadmap Cleanup Script\n');

  // Read roadmap
  console.log('📖 Reading roadmap-data.json...');
  const rawData = fs.readFileSync(roadmapPath, 'utf8');
  const data = JSON.parse(rawData);

  // Create backup
  console.log('💾 Creating backup...');
  fs.writeFileSync(backupPath, rawData, 'utf8');
  console.log(`   ✓ Backup saved to: ${path.basename(backupPath)}\n`);

  // Count original features
  let originalCount = 0;
  data.columns?.forEach(col => {
    col.phases?.forEach(phase => {
      originalCount += phase.features?.length || 0;
    });
  });

  // Clean roadmap
  console.log('🔧 Cleaning roadmap...');
  const cleaned = cleanRoadmap(data);

  // Count cleaned features
  let cleanedCount = 0;
  let removedCount = 0;
  cleaned.columns?.forEach(col => {
    col.phases?.forEach(phase => {
      const count = phase.features?.length || 0;
      cleanedCount += count;
    });
  });
  removedCount = originalCount - cleanedCount;

  // Write cleaned version
  console.log('💾 Writing cleaned roadmap...');
  fs.writeFileSync(roadmapPath, JSON.stringify(cleaned, null, 2), 'utf8');

  console.log('\n✅ Cleanup complete!\n');
  console.log('📊 Summary:');
  console.log(`   Original features: ${originalCount}`);
  console.log(`   Removed features: ${removedCount}`);
  console.log(`   Remaining features: ${cleanedCount}`);
  console.log(`   Reduction: ${((removedCount / originalCount) * 100).toFixed(1)}%\n`);

  console.log('📝 Next steps:');
  console.log('   1. Review the changes: git diff docs/planning/roadmap/roadmap-data.json');
  console.log('   2. If issues found, restore: cp docs/planning/roadmap/roadmap-data.backup.json docs/planning/roadmap/roadmap-data.json');
  console.log('   3. If good, commit the changes\n');
}

main();
