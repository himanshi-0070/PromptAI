'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Project = require('../models/Project');
const { success } = require('../utils/responseFormatter');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Generate access token (expires in 15 minutes)
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.userId, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET || 'access_secret',
    { expiresIn: '15m' }
  );
}

// Generate refresh token (expires in 7 days)
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.userId },
    process.env.REFRESH_TOKEN_SECRET || 'refresh_secret',
    { expiresIn: '7d' }
  );
}

// Common cookie options for refresh token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // standard lax same-site policy for authentication
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * AuthController — Manages Google sign-ins, tokens refresh loops, and logouts.
 */

/**
 * POST /api/v1/auth/google
 * Signs in user with Google ID token.
 */
async function googleSignIn(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      throw new AppError('Google ID token is required.', 400);
    }

    logger.info('[AuthController] Authenticating Google Sign-In request');

    let payload;
    // Helper fallback for mock development mode
    if (process.env.NODE_ENV !== 'production' && idToken.startsWith('mock_')) {
      const mockEmail = idToken.split('_')[1] || 'dev@promptai.dev';
      payload = {
        sub: 'mock_' + mockEmail.replace('@', '_'),
        email: mockEmail,
        name: mockEmail.split('@')[0].toUpperCase(),
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
      };
    } else {
      // Validate with Google OAuth TokenInfo API
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!verifyRes.ok) {
        throw new AppError('Failed to verify Google Identity credentials.', 401);
      }
      payload = await verifyRes.json();
    }

    const { sub: googleId, email, name, picture: avatar } = payload;

    // 1. Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Link Google ID if email already exists
        user.googleId = googleId;
        user.avatar = avatar || user.avatar;
        await user.save();
      } else {
        // Create new user
        user = new User({
          userId: uuidv4(),
          googleId,
          name,
          email,
          avatar,
        });
        await user.save();
        logger.info(`[AuthController] New user registered: ${user.email}`);
      }
    } else {
      // Update info
      user.name = name;
      user.avatar = avatar || user.avatar;
      user.lastLogin = new Date();
      await user.save();
    }

    // 2. Generate new JWT Token Pair
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 3. Save refresh token to user record (Token Rotation logic)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens.push({ token: refreshToken, expiresAt });
    // Truncate older refresh sessions to prevent bloated user document
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }
    await user.save();

    // 4. Send refresh token in HttpOnly secure cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    // 5. Query user project count
    const projectCount = await Project.countDocuments({ ownerId: user.userId });

    return res.json(
      success(
        {
          accessToken,
          user: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            subscriptionTier: user.subscriptionTier,
            preferences: user.preferences,
            projectCount,
          },
        },
        'Sign-in successful.'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Uses refresh token cookie to issue a new short-lived access token.
 */
async function refreshSession(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new AppError('Refresh token cookie is missing.', 401);
    }

    logger.debug('[AuthController] Refreshing access token session');

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret');
    } catch (err) {
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      throw new AppError('Refresh token is expired or invalid.', 401);
    }

    const user = await User.findOne({ userId: decoded.userId });
    if (!user) {
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      throw new AppError('User not found.', 401);
    }

    // Check if refresh token is in user's active tokens list
    const activeTokenIndex = user.refreshTokens.findIndex((rt) => rt.token === refreshToken);
    if (activeTokenIndex === -1) {
      // Reused / stolen token detection! Revoke all tokens for security!
      user.refreshTokens = [];
      await user.save();
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      throw new AppError('Session hijacked or token reused. Please log in again.', 401);
    }

    // Rotation: Issue new refresh token alongside access token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Replace the used refresh token in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens[activeTokenIndex] = { token: newRefreshToken, expiresAt };
    await user.save();

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    const projectCount = await Project.countDocuments({ ownerId: user.userId });

    return res.json(
      success(
        {
          accessToken: newAccessToken,
          user: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            subscriptionTier: user.subscriptionTier,
            preferences: user.preferences,
            projectCount,
          },
        },
        'Token refreshed successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 * Logs out user and destroys sessions.
 */
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      // Verify token to find owner user
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret');
        const user = await User.findOne({ userId: decoded.userId });
        if (user) {
          // Remove from database sessions
          user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
          await user.save();
        }
      } catch (err) {
        // Ignore jwt verification issues on logout
      }
    }

    // Clear refresh token cookies
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return res.json(success(null, 'Logged out successfully.'));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns active logged in user details.
 */
async function getMe(req, res, next) {
  try {
    const user = req.user;
    const projectCount = await Project.countDocuments({ ownerId: user.userId });
    return res.json(
      success({
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          preferences: user.preferences,
          projectCount,
        },
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/auth/preferences
 * Saves theme, editor layouts, and options in User profile preferences.
 */
async function updatePreferences(req, res, next) {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    user.preferences = {
      ...user.preferences.toObject(),
      ...req.body,
    };

    await user.save();
    return res.json(success({ preferences: user.preferences }, 'Preferences saved successfully.'));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  googleSignIn,
  refreshSession,
  logout,
  getMe,
  updatePreferences,
};
