/**
 * Passport Authentication Strategies Configuration
 * Sets up Local and GitHub OAuth strategies (both use JWT, no sessions)
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

/**
 * Local Strategy (Email/Password)
 * Used with { session: false } - returns JWT token instead of creating session
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findByEmail(email);

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Validate password
        const isValid = await User.validatePassword(password, user.password_hash);

        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Remove password_hash from user object before returning
        const { password_hash, ...userWithoutPassword } = user;

        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/**
 * GitHub OAuth Strategy
 * Returns user object - auth route generates JWT token (no session created)
 */
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const callbackURL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback';

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL,
      },
      async (accessToken, _refreshToken, profile, done) => {
        try {
          console.log('[Passport] GitHub OAuth callback invoked for user:', profile.username);

          // Extract email from GitHub profile
          const email = profile.emails?.[0]?.value || `${profile.username}@github.user`;
          console.log('[Passport] Email extracted:', email);

          // Find or create user, storing the GitHub access token for private repo access
          const user = await User.findOrCreateByGithub({
            githubId: profile.id,
            email,
            accessToken,  // Pass access token for storage (will be encrypted)
          });

          console.log('[Passport] User found/created:', user.id);
          return done(null, user);
        } catch (error) {
          console.error('[Passport] GitHub strategy error:', error);
          return done(error);
        }
      }
    )
  );

  // Mask the client ID for security (show first 8 chars only)
  const maskedClientId = process.env.GITHUB_CLIENT_ID.substring(0, 8) + '...';
  console.log(`✅ GitHub OAuth configured (Client ID: ${maskedClientId})`);
  console.log(`✅ GitHub callback URL: ${callbackURL}`);
} else {
  console.warn('⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)');
}

// Note: JWT verification is handled manually in auth middleware (server/src/middleware/auth.js)
// We don't use passport-jwt strategy since we verify tokens directly with jsonwebtoken library

export default passport;
