const mongoose = require('mongoose');

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_CLINIC_IMAGE = '/clinic-default.svg';

const vetClinicSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clinicName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    servicesOffered: {
      type: [String],
      default: [],
    },
    workingHours: {
      openTime: {
        type: String,
        required: true,
        trim: true,
      },
      closeTime: {
        type: String,
        required: true,
        trim: true,
      },
    },
    workingDays: {
      type: [String],
      enum: WEEK_DAYS,
      default: WEEK_DAYS.slice(1, 6),
    },
    appointmentsEnabled: {
      type: Boolean,
      default: true,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    clinicImage: {
      type: String,
      trim: true,
      default: DEFAULT_CLINIC_IMAGE,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(value) {
            return Array.isArray(value) && value.length === 2;
          },
          message: 'Location coordinates must be [longitude, latitude]',
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

vetClinicSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('VetClinic', vetClinicSchema);
