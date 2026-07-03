'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const User = require('../models/User');
const projectService = require('../services/ProjectService');

/**
 * requireAuth — Verifies the access token JWT attached in Authorization headers.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is missing or invalid.', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'access_secret');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired.', 401);
      }
      throw new AppError('Access token is invalid.', 401);
    }

    // Attach user record to request
    const user = await User.findOne({ userId: decoded.userId }).lean();
    if (!user) {
      throw new AppError('User session expired or user not found.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * requireProjectOwner — Verifies that the authenticated user owns the referenced project.
 * Attaches req.project to avoid duplicate DB reads in controllers.
 */
async function requireProjectOwner(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      throw new AppError('Project ID parameter is missing.', 400);
    }

    const project = await projectService.getProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    // Verify ownership
    if (project.ownerId !== req.user.userId) {
      throw new AppError('Access denied: You do not own this project.', 403);
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * requireRole — Authorizes users based on roles (future readiness)
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient privileges.', 403));
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireProjectOwner,
  requireRole,
};
