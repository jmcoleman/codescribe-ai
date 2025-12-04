/**
 * Route Parity Test
 *
 * Ensures that all routes mounted in server/src/server.js (local dev)
 * are also mounted in api/index.js (Vercel production).
 *
 * This prevents silent failures where routes work in dev but return 404 in prod.
 *
 * @see https://github.com/jmcoleman/codescribe-ai/issues/XX - workspace routes 404 in prod
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Route Parity (Dev vs Production)', () => {
  let serverJsContent;
  let apiIndexContent;

  beforeAll(() => {
    // Read both entry point files using process.cwd() (server directory)
    const serverJsPath = path.join(process.cwd(), 'src', 'server.js');
    const apiIndexPath = path.join(process.cwd(), '..', 'api', 'index.js');

    serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
    apiIndexContent = fs.readFileSync(apiIndexPath, 'utf8');
  });

  /**
   * Extract route imports from file content
   * Matches: import xxxRoutes from '...'
   */
  function extractRouteImports(content) {
    const importRegex = /import\s+(\w+Routes)\s+from\s+['"]([^'"]+)['"]/g;
    const imports = new Map();
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const [, varName, importPath] = match;
      // Normalize path to just the filename
      const filename = importPath.split('/').pop().replace('.js', '');
      imports.set(varName, filename);
    }

    return imports;
  }

  /**
   * Extract mounted routes from file content
   * Matches: app.use('/api/xxx', xxxRoutes)
   */
  function extractMountedRoutes(content) {
    const mountRegex = /app\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+Routes)\s*\)/g;
    const mounts = new Map();
    let match;

    while ((match = mountRegex.exec(content)) !== null) {
      const [, routePath, varName] = match;
      mounts.set(varName, routePath);
    }

    return mounts;
  }

  /**
   * Check if a route is conditionally mounted (inside ENABLE_AUTH block)
   * Uses brace counting to handle nested blocks
   */
  function isConditionalRoute(content, routeVarName) {
    const lines = content.split('\n');
    let inEnableAuthBlock = false;
    let braceDepth = 0;
    let foundEnableAuth = false;

    for (const line of lines) {
      // Check for ENABLE_AUTH condition
      if (line.includes('if') && line.includes('ENABLE_AUTH')) {
        foundEnableAuth = true;
        // Count opening braces on this line
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceDepth += openBraces - closeBraces;
        if (braceDepth > 0) {
          inEnableAuthBlock = true;
        }
        continue;
      }

      // If we're tracking an ENABLE_AUTH block
      if (foundEnableAuth && braceDepth > 0) {
        // Check if route is mounted on this line
        if (line.includes(`app.use`) && line.includes(routeVarName)) {
          return true;
        }

        // Track brace depth
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceDepth += openBraces - closeBraces;

        // If we've closed all braces, we've exited the ENABLE_AUTH block
        if (braceDepth <= 0) {
          foundEnableAuth = false;
          inEnableAuthBlock = false;
        }
      }
    }

    return false;
  }

  test('all route files imported in server.js should be imported in api/index.js', () => {
    const serverImports = extractRouteImports(serverJsContent);
    const apiImports = extractRouteImports(apiIndexContent);

    const missingImports = [];

    for (const [varName, filename] of serverImports) {
      if (!apiImports.has(varName)) {
        missingImports.push(`${varName} (from ${filename}.js)`);
      }
    }

    if (missingImports.length > 0) {
      throw new Error(
        `Routes imported in server.js but missing from api/index.js:\n` +
        `  - ${missingImports.join('\n  - ')}\n\n` +
        `Add these imports to api/index.js to prevent 404 errors in production.`
      );
    }
  });

  test('all routes mounted in server.js should be mounted in api/index.js', () => {
    const serverMounts = extractMountedRoutes(serverJsContent);
    const apiMounts = extractMountedRoutes(apiIndexContent);

    const missingMounts = [];

    for (const [varName, routePath] of serverMounts) {
      if (!apiMounts.has(varName)) {
        const isConditional = isConditionalRoute(serverJsContent, varName);
        missingMounts.push({
          varName,
          routePath,
          conditional: isConditional
        });
      }
    }

    if (missingMounts.length > 0) {
      const details = missingMounts.map(m =>
        `${m.varName} at '${m.routePath}'${m.conditional ? ' (requires ENABLE_AUTH)' : ''}`
      );

      throw new Error(
        `Routes mounted in server.js but missing from api/index.js:\n` +
        `  - ${details.join('\n  - ')}\n\n` +
        `Add these route mounts to api/index.js to prevent 404 errors in production.`
      );
    }
  });

  test('route paths should match between server.js and api/index.js', () => {
    const serverMounts = extractMountedRoutes(serverJsContent);
    const apiMounts = extractMountedRoutes(apiIndexContent);

    const pathMismatches = [];

    for (const [varName, serverPath] of serverMounts) {
      const apiPath = apiMounts.get(varName);
      if (apiPath && apiPath !== serverPath) {
        pathMismatches.push({
          varName,
          serverPath,
          apiPath
        });
      }
    }

    if (pathMismatches.length > 0) {
      const details = pathMismatches.map(m =>
        `${m.varName}: server.js='${m.serverPath}' vs api/index.js='${m.apiPath}'`
      );

      throw new Error(
        `Route path mismatches between server.js and api/index.js:\n` +
        `  - ${details.join('\n  - ')}\n\n` +
        `Ensure route paths match in both files.`
      );
    }
  });

  test('conditional routes in server.js should also be conditional in api/index.js', () => {
    const serverMounts = extractMountedRoutes(serverJsContent);
    const apiMounts = extractMountedRoutes(apiIndexContent);

    const conditionalMismatches = [];

    for (const [varName] of serverMounts) {
      if (!apiMounts.has(varName)) continue; // Already caught by other test

      const serverConditional = isConditionalRoute(serverJsContent, varName);
      const apiConditional = isConditionalRoute(apiIndexContent, varName);

      if (serverConditional !== apiConditional) {
        conditionalMismatches.push({
          varName,
          serverConditional,
          apiConditional
        });
      }
    }

    if (conditionalMismatches.length > 0) {
      const details = conditionalMismatches.map(m =>
        `${m.varName}: server.js=${m.serverConditional ? 'conditional' : 'always'} vs ` +
        `api/index.js=${m.apiConditional ? 'conditional' : 'always'}`
      );

      throw new Error(
        `Route conditional mounting mismatches:\n` +
        `  - ${details.join('\n  - ')}\n\n` +
        `Routes that require ENABLE_AUTH in server.js should also be conditional in api/index.js.`
      );
    }
  });

  test('should list all mounted routes for documentation', () => {
    const serverMounts = extractMountedRoutes(serverJsContent);
    const apiMounts = extractMountedRoutes(apiIndexContent);

    console.log('\n📋 Route Summary:');
    console.log('─'.repeat(60));
    console.log(`server.js routes: ${serverMounts.size}`);
    console.log(`api/index.js routes: ${apiMounts.size}`);
    console.log('─'.repeat(60));

    // This test always passes - it's just for documentation
    expect(serverMounts.size).toBeGreaterThan(0);
    expect(apiMounts.size).toBeGreaterThan(0);
  });
});
