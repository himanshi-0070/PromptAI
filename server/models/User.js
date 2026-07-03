'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    subscriptionTier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    projectCount: {
      type: Number,
      default: 0,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'dark',
      },
      editorPreferences: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
      },
      panelLayout: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
      },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
