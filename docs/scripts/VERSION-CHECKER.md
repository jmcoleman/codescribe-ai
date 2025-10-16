# Version Checker Script

**Script:** `scripts/check-versions.js`
**Purpose:** Retrieve and display versions of all technologies used in CodeScribe AI
**Last Updated:** October 16, 2025

---

## Overview

The version checker script is a comprehensive utility that scans both the frontend (client) and backend (server) packages to retrieve and display the actual installed versions of all dependencies. This ensures documentation stays accurate and helps with debugging version-related issues.

### Features

- **Colorized Terminal Output**: Beautiful, easy-to-read output with color-coded sections
- **Comprehensive Coverage**: Checks all major dependencies across frontend and backend
- **System Information**: Displays Node.js, npm, and git versions
- **AI Model Detection**: Automatically detects the Claude model being used
- **Summary Statistics**: Shows total package counts and breakdown
- **Real-Time Data**: Reads from actual `node_modules` installations, not just `package.json`

---

## Usage

### Quick Run

```bash
# From project root
npm run check-versions

# Or the shorter alias
npm run versions

# Or run directly
node scripts/check-versions.js
```

### Output Sections

The script organizes information into the following sections:

1. **System Environment**
   - Node.js version
   - npm version
   - git version

2. **Frontend Stack (client/)**
   - Core Framework (React, React DOM, Vite)
   - UI & Styling (Tailwind CSS, Lucide React, react-hot-toast)
   - Code Editor & Markdown (Monaco Editor, react-markdown, etc.)
   - Diagrams & Visualization (Mermaid)
   - Development Tools (ESLint, Vitest, Testing Library, etc.)

3. **Backend Stack (server/)**
   - Core Framework (Express, CORS, dotenv)
   - AI & Code Analysis (Anthropic SDK, Acorn)
   - Middleware & Utilities (express-rate-limit, Multer)
   - Development Tools (Nodemon, Jest, Supertest)

4. **AI Model Configuration**
   - Claude model identifier
   - Human-readable model name

5. **Package Metadata**
   - Client and server package versions
   - Dependency counts

6. **Summary**
   - Total package counts
   - Breakdown by production vs development

### Example Output

```
TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW
Q        CodeScribe AI - Technology Version Report        Q
ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]

 System Environment 
  Node.js                        22.19.0
  npm                            11.6.0
  git                            2.51.0

 Frontend Stack (client/) 

Core Framework:
  React                          19.2.0
  React DOM                      19.2.0
  Vite                           7.1.9

[... additional sections ...]

 Summary 
  Client Dependencies            9 production + 18 dev
  Server Dependencies            7 production + 6 dev
  Total Packages                 40


Generated: 2025-10-16T17:41:32.431Z
```

---

## Use Cases

### 1. Documentation Updates
Before updating version numbers in documentation (ARCHITECTURE.md, CLAUDE.md, etc.), run this script to get the accurate installed versions.

```bash
npm run versions > current-versions.txt
```

### 2. Debugging Version Issues
If you encounter issues with package compatibility, run this script to verify what's actually installed vs. what's specified in `package.json`.

### 3. Dependency Audits
Use this script during security audits or dependency reviews to quickly see all technology versions in one place.

### 4. Onboarding New Developers
New team members can run this script to see the complete technology stack at a glance.

### 5. CI/CD Integration
Include this script in your CI pipeline to log technology versions with each build.

```yaml
# Example GitHub Actions step
- name: Check Technology Versions
  run: npm run versions
```

---

## How It Works

The script performs the following operations:

1. Reads `package.json` files from both `client/` and `server/` directories
2. Executes `npm list` for each package to get actual installed versions
3. Parses source code (`claudeClient.js`) to detect the Claude model configuration
4. Formats output with ANSI color codes for terminal display
5. Calculates statistics including total package counts

---

## Troubleshooting

### "Not installed" Shows for a Package
This means the package is listed in `package.json` but not found in `node_modules`. Run:

```bash
npm run install:all
```

### Script Fails to Run
Ensure you're using Node.js 20+ and have npm installed:

```bash
node --version  # Should be 20.0.0 or higher
npm --version   # Should be present
```

### Colors Not Displaying
Some terminals may not support ANSI color codes. The script will still work, but output may show escape codes instead of colors.

---

## Maintenance

### Adding New Packages
When new dependencies are added to the project:

1. **No changes needed** to the script - it automatically reads from `package.json`
2. To feature a new package prominently, edit the `scripts/check-versions.js` arrays:
   - `frontendCore`, `uiPackages`, `editorPackages`, etc. (for client)
   - `backendCore`, `aiPackages`, `middlewarePackages`, etc. (for server)

### Updating the Script
The script is located at: `scripts/check-versions.js`

Key functions:
- `getInstalledVersion()` - Retrieves version using `npm list`
- `formatVersion()` - Formats output with colors and alignment
- `main()` - Orchestrates all checks and output

---

## Related Documentation

- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Technology stack tables (should match this script's output)
- [CLAUDE.md](../../CLAUDE.md) - Tech stack summary
- [API-Reference.md](../api/API-Reference.md) - API technology stack
- [Dev-Guide.md](../planning/05-Dev-Guide.md) - Technology stack justification

---

## Version History

- **v1.0.0** (October 16, 2025) - Initial version with full frontend/backend coverage
