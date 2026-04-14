const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  rescueId: String,
  description: String,
  lat: Number,
  lng: Number,
  locationSource: String,
  media: [String],
  status: String,
  createdAt: Date,
});

module.exports = mongoose.model("Report", reportSchema);
