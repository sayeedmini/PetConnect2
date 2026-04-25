const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VetClinic',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'rejected'],
      default: 'approved',
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ clinic: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ clinic: 1, moderationStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
