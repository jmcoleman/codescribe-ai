#!/usr/bin/env node

/**
 * Bump Version Script
 *
 * Updates version in all three package.json files (root, client, server)
 *
 * Usage:
 *   npm run version:bump <new-version>
 *   npm run version:bump 2.4.5
 *
 * Or use npm's version command:
 *   npm run version:patch  (2.4.4 → 2.4.5)
 *   npm run version:minor  (2.4.4 → 2.5.0)
 *   npm run version:major  (2.4.4 → 3.0.0)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const packagePaths = [
  join(rootDir, 'package.json'),
  join(rootDir, 'client', 'package.json'),
  join(rootDir, 'server', 'package.json'),
];

function getCurrentVersion() {
  const rootPkg = JSON.parse(readFileSync(packagePaths[0], 'utf8'));
  return rootPkg.version;
}

function bumpVersion(type) {
  const current = getCurrentVersion();
  const parts = current.split('.').map(Number);

  switch (type) {
    case 'patch':
      parts[2]++;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    default:
      throw new Error(`Invalid bump type: ${type}. Use 'patch', 'minor', or 'major'`);
  }

  return parts.join('.');
}

function setVersion(newVersion) {
  console.log(`\n🔄 Updating version in all package.json files...\n`);

  for (const pkgPath of packagePaths) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const oldVersion = pkg.version;
    pkg.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

    const relativePath = pkgPath.replace(rootDir + '/', '');
    console.log(`  ✅ ${relativePath}: ${oldVersion} → ${newVersion}`);
  }

  console.log(`\n✨ Successfully updated all packages to v${newVersion}\n`);
  console.log(`Next steps:`);
  console.log(`  1. git add package.json client/package.json server/package.json`);
  console.log(`  2. git commit -m "chore: bump version to v${newVersion}"`);
  console.log(`  3. git push\n`);
}

// Get arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('\n❌ Error: No version or bump type specified\n');
  console.log('Usage:');
  console.log('  npm run version:bump <version>     # Set specific version');
  console.log('  npm run version:patch              # 2.4.4 → 2.4.5');
  console.log('  npm run version:minor              # 2.4.4 → 2.5.0');
  console.log('  npm run version:major              # 2.4.4 → 3.0.0\n');
  console.log('Examples:');
  console.log('  npm run version:bump 2.4.5');
  console.log('  npm run version:patch\n');
  process.exit(1);
}

const input = args[0];

// Check if input is a version number or bump type
if (input.match(/^\d+\.\d+\.\d+$/)) {
  // Specific version
  setVersion(input);
} else if (['patch', 'minor', 'major'].includes(input)) {
  // Bump type
  const newVersion = bumpVersion(input);
  setVersion(newVersion);
} else {
  console.error(`\n❌ Error: Invalid input "${input}"\n`);
  console.log('Expected:');
  console.log('  - Semantic version (e.g., 2.4.5)');
  console.log('  - Bump type: patch, minor, or major\n');
  process.exit(1);
}
