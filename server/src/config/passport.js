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
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
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
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract email from GitHub profile
          const email = profile.emails?.[0]?.value || `${profile.username}@github.user`;

          // Find or create user
          const user = await User.findOrCreateByGithub({
            githubId: profile.id,
            email,
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Mask the client ID for security (show first 8 chars only)
  const maskedClientId = process.env.GITHUB_CLIENT_ID.substring(0, 8) + '...';
  console.log(`✅ GitHub OAuth configured (Client ID: ${maskedClientId})`);
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
