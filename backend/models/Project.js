// backend/models/Project.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  canvas: {
    width: {
      type: Number,
      default: 1440
    },
    height: {
      type: Number,
      default: 900
    },
    background: {
      type: String,
      default: '#FFFFFF'
    }
  },
  elements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Element'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', ProjectSchema);