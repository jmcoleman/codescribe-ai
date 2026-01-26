#!/usr/bin/env node
/**
 * Refactoring Script: Rename campaigns → trial_programs
 *
 * This script safely renames all campaign references to trial_program across:
 * - Backend files (models, services, routes)
 * - Frontend files (components, pages, contexts)
 * - Documentation
 *
 * Usage: node scripts/refactor-campaigns-to-trial-programs.js [--dry-run]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

// Track changes
const changes = {
  filesRenamed: [],
  filesModified: [],
  errors: [],
};

// Dry run mode (preview changes without applying)
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('🔍 DRY RUN MODE - No changes will be applied\n');
}

/**
 * File rename mappings
 */
const FILE_RENAMES = [
  // Backend
  { from: 'server/src/models/Campaign.js', to: 'server/src/models/TrialProgram.js' },

  // Frontend
  { from: 'client/src/pages/admin/Campaigns.jsx', to: 'client/src/pages/admin/TrialPrograms.jsx' },

  // Docs
  { from: 'docs/admin/CAMPAIGN-MANAGEMENT-GUIDE.md', to: 'docs/admin/TRIAL-PROGRAM-GUIDE.md' },
];

/**
 * Content replacement patterns
 * Order matters! More specific patterns first.
 */
const REPLACEMENTS = [
  // === Backend: Import statements ===
  { pattern: /from ['"]\.\.\/models\/Campaign\.js['"]/g, replacement: "from '../models/TrialProgram.js'" },
  { pattern: /import Campaign from/g, replacement: 'import TrialProgram from' },

  // === Backend: Class and export ===
  { pattern: /class Campaign \{/g, replacement: 'class TrialProgram {' },
  { pattern: /export default Campaign/g, replacement: 'export default TrialProgram' },

  // === Backend: Variable names ===
  { pattern: /const campaign =/g, replacement: 'const trialProgram =' },
  { pattern: /let campaign =/g, replacement: 'let trialProgram =' },
  { pattern: /\bcampaign\./g, replacement: 'trialProgram.' },
  { pattern: /\(campaign\)/g, replacement: '(trialProgram)' },
  { pattern: /\{campaign\}/g, replacement: '{trialProgram}' },
  { pattern: /\bcampaigns\./g, replacement: 'trialPrograms.' },
  { pattern: /const campaigns =/g, replacement: 'const trialPrograms =' },

  // === Backend: Function parameters ===
  { pattern: /Campaign\./g, replacement: 'TrialProgram.' },

  // === Backend: Method names in Trial model ===
  { pattern: /checkEligibilityForCampaign/g, replacement: 'checkEligibilityForProgram' },

  // === Backend: Database table names in SQL ===
  { pattern: /FROM campaigns/g, replacement: 'FROM trial_programs' },
  { pattern: /INTO campaigns/g, replacement: 'INTO trial_programs' },
  { pattern: /UPDATE campaigns/g, replacement: 'UPDATE trial_programs' },
  { pattern: /DELETE FROM campaigns/g, replacement: 'DELETE FROM trial_programs' },
  { pattern: /JOIN campaigns/g, replacement: 'JOIN trial_programs' },

  // === Backend: Column names in SQL ===
  { pattern: /campaign_id/g, replacement: 'trial_program_id' },

  // === Backend: API routes ===
  { pattern: /\/api\/admin\/campaigns/g, replacement: '/api/admin/trial-programs' },

  // === Backend: Comments and documentation ===
  { pattern: /Campaign Model/g, replacement: 'TrialProgram Model' },
  { pattern: /Campaign schema/g, replacement: 'TrialProgram schema' },
  { pattern: /\(campaigns table\)/g, replacement: '(trial_programs table)' },
  { pattern: /auto-trial campaigns/g, replacement: 'trial programs' },
  { pattern: /trial campaigns/g, replacement: 'trial programs' },

  // === Frontend: Component names ===
  { pattern: /import Campaigns from/g, replacement: 'import TrialPrograms from' },
  { pattern: /from ['"]\.\.\/pages\/admin\/Campaigns/g, replacement: "from '../pages/admin/TrialPrograms" },
  { pattern: /<Campaigns/g, replacement: '<TrialPrograms' },
  { pattern: /\/Campaigns/g, replacement: '/TrialPrograms' },

  // === Frontend: Routes ===
  { pattern: /\/admin\/campaigns/g, replacement: '/admin/trial-programs' },

  // === Frontend: State and variables ===
  { pattern: /\[campaigns, setCampaigns\]/g, replacement: '[trialPrograms, setTrialPrograms]' },
  { pattern: /const \[campaign,/g, replacement: 'const [trialProgram,' },
  { pattern: /setCampaign\(/g, replacement: 'setTrialProgram(' },
  { pattern: /editingCampaign/g, replacement: 'editingTrialProgram' },
  { pattern: /deletingCampaign/g, replacement: 'deletingTrialProgram' },
  { pattern: /showCampaign/g, replacement: 'showTrialProgram' },
  { pattern: /fetchCampaigns/g, replacement: 'fetchTrialPrograms' },

  // === Frontend: UI Text (must be after variable names) ===
  { pattern: /Campaign Name/g, replacement: 'Trial Program Name' },
  { pattern: /New Campaign/g, replacement: 'New Trial Program' },
  { pattern: /Create Campaign/g, replacement: 'Create Trial Program' },
  { pattern: /Edit Campaign/g, replacement: 'Edit Trial Program' },
  { pattern: /Delete Campaign/g, replacement: 'Delete Trial Program' },
  { pattern: /campaign active/gi, replacement: 'trial program active' },
  { pattern: /Campaign Active/g, replacement: 'Trial Program Active' },
  { pattern: /No campaigns/g, replacement: 'No trial programs' },
  { pattern: /"Campaigns"/g, replacement: '"Trial Programs"' },
  { pattern: /'Campaigns'/g, replacement: "'Trial Programs'" },
  { pattern: /\bCampaign\b/g, replacement: 'Trial Program' }, // Word boundary for remaining cases

  // === CSV/Export field names ===
  { pattern: /campaign_name/g, replacement: 'trial_program_name' },
  { pattern: /campaignId/g, replacement: 'trialProgramId' },
  { pattern: /campaignName/g, replacement: 'trialProgramName' },
];

/**
 * Files to update (patterns)
 */
const FILES_TO_UPDATE = [
  // Backend
  'server/src/models/**/*.js',
  'server/src/routes/**/*.js',
  'server/src/services/**/*.js',
  'server/src/middleware/**/*.js',

  // Frontend
  'client/src/**/*.jsx',
  'client/src/**/*.js',

  // Tests
  'server/src/**/*.test.js',
  'client/src/**/*.test.jsx',

  // Docs
  'docs/**/*.md',
];

/**
 * Rename a file
 */
async function renameFile(fromPath, toPath) {
  const from = path.join(ROOT, fromPath);
  const to = path.join(ROOT, toPath);

  try {
    await fs.access(from);

    if (DRY_RUN) {
      console.log(`📝 Would rename: ${fromPath} → ${toPath}`);
      changes.filesRenamed.push({ from: fromPath, to: toPath });
    } else {
      await fs.rename(from, to);
      console.log(`✅ Renamed: ${fromPath} → ${toPath}`);
      changes.filesRenamed.push({ from: fromPath, to: toPath });
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⚠️  File not found: ${fromPath}`);
    } else {
      console.error(`❌ Error renaming ${fromPath}:`, error.message);
      changes.errors.push({ file: fromPath, error: error.message });
    }
  }
}

/**
 * Apply replacements to file content
 */
function applyReplacements(content, filePath) {
  let modified = content;
  let changeCount = 0;

  for (const { pattern, replacement } of REPLACEMENTS) {
    const before = modified;
    modified = modified.replace(pattern, replacement);
    if (modified !== before) {
      changeCount++;
    }
  }

  return { modified, changeCount };
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    const fullPath = path.join(ROOT, filePath);
    const content = await fs.readFile(fullPath, 'utf8');

    const { modified, changeCount } = applyReplacements(content, filePath);

    if (modified !== content) {
      if (DRY_RUN) {
        console.log(`📝 Would update: ${filePath} (${changeCount} pattern matches)`);
      } else {
        await fs.writeFile(fullPath, modified, 'utf8');
        console.log(`✅ Updated: ${filePath} (${changeCount} pattern matches)`);
      }
      changes.filesModified.push({ path: filePath, changes: changeCount });
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      changes.errors.push({ file: filePath, error: error.message });
    }
  }
}

/**
 * Find files matching patterns
 */
async function findFiles(patterns) {
  const files = [];

  for (const pattern of patterns) {
    // Simple glob implementation for our needs
    const parts = pattern.split('**/');
    if (parts.length === 2) {
      const [base, ext] = parts;
      const baseDir = path.join(ROOT, base);

      try {
        const found = await findFilesRecursive(baseDir, ext);
        files.push(...found.map(f => path.relative(ROOT, f)));
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

/**
 * Recursively find files matching extension
 */
async function findFilesRecursive(dir, pattern) {
  const files = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          files.push(...await findFilesRecursive(fullPath, pattern));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (pattern.includes(ext) || pattern === '*') {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Ignore errors (directory doesn't exist, permission denied, etc.)
  }

  return files;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting refactoring: campaigns → trial_programs\n');

  // Step 1: Rename files
  console.log('📁 Step 1: Renaming files...\n');
  for (const { from, to } of FILE_RENAMES) {
    await renameFile(from, to);
  }

  // Step 2: Update file contents
  console.log('\n📝 Step 2: Updating file contents...\n');
  const filesToUpdate = await findFiles(FILES_TO_UPDATE);

  console.log(`Found ${filesToUpdate.length} files to process\n`);

  for (const file of filesToUpdate) {
    await processFile(file);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 REFACTORING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files renamed: ${changes.filesRenamed.length}`);
  console.log(`Files modified: ${changes.filesModified.length}`);
  console.log(`Errors: ${changes.errors.length}`);

  if (changes.filesRenamed.length > 0) {
    console.log('\n📁 Renamed files:');
    changes.filesRenamed.forEach(({ from, to }) => {
      console.log(`  ${from} → ${to}`);
    });
  }

  if (changes.errors.length > 0) {
    console.log('\n❌ Errors:');
    changes.errors.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
  }

  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Refactoring complete!');
    console.log('\n📋 Next steps:');
    console.log('  1. Run: npm test (server) - Check backend tests');
    console.log('  2. Run: npm test (client) - Check frontend tests');
    console.log('  3. Manual testing in the UI');
    console.log('  4. Update CSV export templates');
    console.log('  5. Update Google Sheets templates');
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
