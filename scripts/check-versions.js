#!/usr/bin/env node

/**
 * CodeScribe AI - Version Checker
 *
 * This script retrieves and displays the versions of all technologies
 * used in the CodeScribe AI application (frontend and backend).
 *
 * Usage:
 *   node check-versions.js
 *   npm run check-versions
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

/**
 * Read and parse package.json file
 */
function getPackageJson(path) {
  try {
    const fullPath = join(projectRoot, path);
    if (!existsSync(fullPath)) {
      return null;
    }
    const content = readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error reading ${path}:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Get installed version of a package using npm list
 */
function getInstalledVersion(packageName, directory) {
  try {
    const command = `npm list ${packageName} --depth=0 --json`;
    const output = execSync(command, {
      cwd: join(projectRoot, directory),
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString();

    const json = JSON.parse(output);
    const deps = json.dependencies || {};

    if (deps[packageName]) {
      return deps[packageName].version;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get Node.js version
 */
function getNodeVersion() {
  return process.version.replace('v', '');
}

/**
 * Get npm version
 */
function getNpmVersion() {
  try {
    return execSync('npm --version', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'Not found';
  }
}

/**
 * Get git version
 */
function getGitVersion() {
  try {
    return execSync('git --version', { encoding: 'utf8' }).trim().replace('git version ', '');
  } catch (error) {
    return 'Not found';
  }
}

/**
 * Format version output with alignment
 */
function formatVersion(name, version, maxNameLength = 30) {
  const padding = ' '.repeat(Math.max(0, maxNameLength - name.length));
  const versionColor = version === 'Not found' || version === 'Not installed' ? colors.red : colors.green;
  return `  ${colors.cyan}${name}${colors.reset}${padding} ${versionColor}${version}${colors.reset}`;
}

/**
 * Print section header
 */
function printHeader(title) {
  console.log(`\n${colors.bright}${colors.blue}━━━ ${title} ━━━${colors.reset}`);
}

/**
 * Print subsection header
 */
function printSubHeader(title) {
  console.log(`\n${colors.yellow}${title}:${colors.reset}`);
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bright}${colors.magenta}\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║        CodeScribe AI - Technology Version Report        ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // System Information
  printHeader('System Environment');
  console.log(formatVersion('Node.js', getNodeVersion()));
  console.log(formatVersion('npm', getNpmVersion()));
  console.log(formatVersion('git', getGitVersion()));

  // Frontend Dependencies
  printHeader('Frontend Stack (client/)');

  const clientPackage = getPackageJson('client/package.json');

  if (clientPackage) {
    printSubHeader('Core Framework');
    const frontendCore = [
      ['React', 'react'],
      ['React DOM', 'react-dom'],
      ['Vite', 'vite']
    ];

    frontendCore.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'client') || 'Not installed';
      console.log(formatVersion(name, version));
    });

    printSubHeader('UI & Styling');
    const uiPackages = [
      ['Tailwind CSS', 'tailwindcss'],
      ['Lucide React', 'lucide-react'],
      ['react-hot-toast', 'react-hot-toast']
    ];

    uiPackages.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'client') || 'Not installed';
      console.log(formatVersion(name, version));
    });

    printSubHeader('Code Editor & Markdown');
    const editorPackages = [
      ['Monaco Editor', '@monaco-editor/react'],
      ['react-markdown', 'react-markdown'],
      ['react-syntax-highlighter', 'react-syntax-highlighter'],
      ['remark-gfm', 'remark-gfm']
    ];

    editorPackages.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'client') || 'Not installed';
      console.log(formatVersion(name, version));
    });

    printSubHeader('Diagrams & Visualization');
    const diagramPackages = [
      ['Mermaid', 'mermaid']
    ];

    diagramPackages.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'client') || 'Not installed';
      console.log(formatVersion(name, version));
    });

    printSubHeader('Development Tools');
    const clientDevPackages = [
      ['ESLint', 'eslint'],
      ['Vitest', 'vitest'],
      ['React Testing Library', '@testing-library/react'],
      ['PostCSS', 'postcss'],
      ['Autoprefixer', 'autoprefixer'],
      ['rollup-plugin-visualizer', 'rollup-plugin-visualizer']
    ];

    clientDevPackages.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'client') || 'Not installed';
      console.log(formatVersion(name, version));
    });
  } else {
    console.log(`${colors.red}  ✗ client/package.json not found${colors.reset}`);
  }

  // Backend Dependencies
  printHeader('Backend Stack (server/)');

  const serverPackage = getPackageJson('server/package.json');

  if (serverPackage) {
    printSubHeader('Core Framework');
    const backendCore = [
      ['Express', 'express'],
      ['CORS', 'cors'],
      ['dotenv', 'dotenv']
    ];

    backendCore.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'server') || 'Not installed';
      console.log(formatVersion(name, version));
    });

    printSubHeader('AI & Code Analysis');
    const aiPackages = [
      ['Anthropic SDK', '@anthropic-ai/sdk'],
      ['Acorn (AST Parser)', 'acorn']
    ];

    aiPackages.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'server') || 'Not installed';
      console.log(formatVersion(name, version));
    });

    printSubHeader('Middleware & Utilities');
    const middlewarePackages = [
      ['express-rate-limit', 'express-rate-limit'],
      ['Multer', 'multer']
    ];

    middlewarePackages.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'server') || 'Not installed';
      console.log(formatVersion(name, version));
    });

    printSubHeader('Development Tools');
    const serverDevPackages = [
      ['Nodemon', 'nodemon'],
      ['Jest', 'jest'],
      ['Supertest', 'supertest']
    ];

    serverDevPackages.forEach(([name, pkg]) => {
      const version = getInstalledVersion(pkg, 'server') || 'Not installed';
      console.log(formatVersion(name, version));
    });
  } else {
    console.log(`${colors.red}  ✗ server/package.json not found${colors.reset}`);
  }

  // Claude API Model Information
  printHeader('AI Model Configuration');

  try {
    const claudeClientPath = join(projectRoot, 'server/src/services/claudeClient.js');
    if (existsSync(claudeClientPath)) {
      const content = readFileSync(claudeClientPath, 'utf8');
      const modelMatch = content.match(/this\.model\s*=\s*['"]([^'"]+)['"]/);
      const model = modelMatch ? modelMatch[1] : 'Not found in code';
      console.log(formatVersion('Claude Model', model));

      // Parse model name for display
      if (model.includes('sonnet')) {
        const version = model.includes('4-20250514') ? 'Sonnet 4.5 (April 2025)' : 'Sonnet 4';
        console.log(formatVersion('Model Name', version));
      }
    } else {
      console.log(formatVersion('Claude Model', 'claudeClient.js not found'));
    }
  } catch (error) {
    console.log(formatVersion('Claude Model', 'Error reading config'));
  }

  // Package.json versions
  printHeader('Package Metadata');

  if (clientPackage) {
    console.log(formatVersion('Client Package Version', clientPackage.version || 'N/A'));
  }

  if (serverPackage) {
    console.log(formatVersion('Server Package Version', serverPackage.version || 'N/A'));
  }

  // Summary Statistics
  printHeader('Summary');

  let totalPackages = 0;
  let installedPackages = 0;

  if (clientPackage) {
    const clientDeps = Object.keys(clientPackage.dependencies || {}).length;
    const clientDevDeps = Object.keys(clientPackage.devDependencies || {}).length;
    totalPackages += clientDeps + clientDevDeps;
    console.log(formatVersion('Client Dependencies', `${clientDeps} production + ${clientDevDeps} dev`));
  }

  if (serverPackage) {
    const serverDeps = Object.keys(serverPackage.dependencies || {}).length;
    const serverDevDeps = Object.keys(serverPackage.devDependencies || {}).length;
    totalPackages += serverDeps + serverDevDeps;
    console.log(formatVersion('Server Dependencies', `${serverDeps} production + ${serverDevDeps} dev`));
  }

  console.log(formatVersion('Total Packages', totalPackages.toString()));

  // Footer
  console.log(`\n${colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.dim}Generated: ${new Date().toISOString()}${colors.reset}\n`);
}

// Run the script
main();
