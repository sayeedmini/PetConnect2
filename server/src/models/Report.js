const mongoose = require("mongoose");

const trackingLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema({
  rescueId: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  lat: {
    type: Number,
    default: null,
  },
  lng: {
    type: Number,
    default: null,
  },
  locationSource: {
    type: String,
    default: "",
  },
  media: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    default: "open",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  assignedRescuerId: {
    type: String,
    default: "",
  },
  assignedRescuerName: {
    type: String,
    default: "",
  },

  currentRescuerLat: {
    type: Number,
    default: null,
  },
  currentRescuerLng: {
    type: Number,
    default: null,
  },

  acceptedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },

  trackingLogs: {
    type: [trackingLogSchema],
    default: [],
  },

  isSuccessStory: {
    type: Boolean,
    default: false,
  },
  storyTitle: {
    type: String,
    default: "",
  },
  storyDescription: {
    type: String,
    default: "",
  },
  featuredImage: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Report", reportSchema);