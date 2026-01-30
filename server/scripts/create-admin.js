/**
 * Create Admin User Script
 *
 * Creates a test admin user for development
 *
 * Usage:
 *   npm run create:admin
 *
 * ⚠️  For DEVELOPMENT only!
 */

import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// Default admin credentials
const ADMIN_EMAIL = 'admin@codescribe.local';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_FIRST_NAME = 'Admin';
const ADMIN_LAST_NAME = 'User';

// Verify database connection
const dbUrl = process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error(`${colors.red}❌ Error: POSTGRES_URL not found in environment${colors.reset}`);
  process.exit(1);
}

// Safety check - prevent running on production
if (process.env.NODE_ENV === 'production' || dbUrl.includes('prod') || dbUrl.includes('production')) {
  console.error(`${colors.red}❌ DANGER: This appears to be a PRODUCTION database!${colors.reset}`);
  console.error(`${colors.yellow}This script should only be run on DEVELOPMENT databases.${colors.reset}`);
  process.exit(1);
}

(async () => {
  try {
    console.log(`${colors.cyan}${colors.bright}👤 Create Admin User${colors.reset}\n`);

    // Check if user already exists
    const existing = await sql`SELECT id, email, role FROM users WHERE email = ${ADMIN_EMAIL}`;

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      console.log(`${colors.yellow}⚠️  User already exists:${colors.reset}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role:  ${user.role}`);
      console.log(`   ID:    ${user.id}\n`);

      if (user.role !== 'admin') {
        console.log(`${colors.yellow}Promoting user to admin...${colors.reset}`);
        await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;
        console.log(`${colors.green}✅ User promoted to admin${colors.reset}\n`);
      } else {
        console.log(`${colors.green}✅ User is already an admin${colors.reset}\n`);
      }

      console.log(`${colors.cyan}Credentials:${colors.reset}`);
      console.log(`   Email:    ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}\n`);
      process.exit(0);
    }

    // Hash password
    console.log(`${colors.yellow}⏳ Creating new admin user...${colors.reset}\n`);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    const result = await sql`
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        email_verified,
        role,
        created_at,
        updated_at
      ) VALUES (
        ${ADMIN_EMAIL},
        ${passwordHash},
        ${ADMIN_FIRST_NAME},
        ${ADMIN_LAST_NAME},
        true,
        'admin',
        NOW(),
        NOW()
      )
      RETURNING id, email, role
    `;

    const user = result.rows[0];

    console.log(`${colors.green}${colors.bright}✅ Admin user created successfully!${colors.reset}\n`);
    console.log(`${colors.cyan}Credentials:${colors.reset}`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   User ID:  ${user.id}\n`);
    console.log(`${colors.yellow}You can now log in at: http://localhost:5173/login${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
