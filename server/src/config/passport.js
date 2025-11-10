/**
 * Passport Authentication Strategies Configuration
 * Sets up Local, GitHub OAuth, and JWT strategies
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.js';

/**
 * Serialize user for session
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
  try {
    console.log(`[Passport] Deserializing user ID: ${id}`);
    const user = await User.findById(id);

    if (!user) {
      console.log(`[Passport] User not found for ID: ${id} - clearing invalid session`);
      return done(null, false); // Null user = clear session, don't throw error
    }

    console.log(`[Passport] Successfully deserialized user: ${user.id} (${user.email})`);
    done(null, user);
  } catch (error) {
    console.error(`[Passport] Error deserializing user ID ${id}:`, {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // Don't propagate error - return false to clear invalid session
    // This prevents 500 errors on all authenticated endpoints
    done(null, false);
  }
});

/**
 * Local Strategy (Email/Password)
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
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('[Passport] GitHub OAuth callback invoked for user:', profile.username);

          // Extract email from GitHub profile
          const email = profile.emails?.[0]?.value || `${profile.username}@github.user`;
          console.log('[Passport] Email extracted:', email);

          // Find or create user
          const user = await User.findOrCreateByGithub({
            githubId: profile.id,
            email,
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

/**
 * JWT Strategy
 */
if (process.env.JWT_SECRET) {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          // Find user by ID from JWT payload
          const user = await User.findById(payload.userId);

          if (!user) {
            return done(null, false);
          }

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
} else {
  console.warn('⚠️  JWT authentication not configured (missing JWT_SECRET)');
}

export default passport;
