'use strict';

const mongoose = require('mongoose');
const { PROJECT_STATUS } = require('../config/constants');

/**
 * Project Schema — stores metadata only.
 * Generated source code lives on the filesystem.
 * MongoDB is never used to store file contents.
 */
const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const fileMetaSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    language: { type: String, default: 'plaintext' },
    purpose: { type: String, default: '' },
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    prompt: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    modifiedFiles: { type: [String], default: [] },
    summary: { type: String, default: '' },
    commitHash: { type: String },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    projectId: {
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
    description: {
      type: String,
      default: '',
    },
    prompt: {
      type: String,
      required: true,
    },
    projectPath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.PENDING,
    },
    dependencies: {
      type: [String],
      default: [],
    },
    folderTree: {
      type: [String],
      default: [],
    },
    filesMeta: {
      type: [fileMetaSchema],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
    chatHistory: {
      type: [chatMessageSchema],
      default: [],
    },
    aiProvider: {
      type: String,
      default: 'gemini',
    },
    generationDurationMs: {
      type: Number,
      default: 0,
    },
    versions: {
      type: [versionSchema],
      default: [],
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
projectSchema.index({ name: 'text', prompt: 'text', description: 'text' });
projectSchema.index({ ownerId: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
