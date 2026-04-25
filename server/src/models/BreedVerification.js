const mongoose = require('mongoose');

const breedVerificationSchema = new mongoose.Schema({
  userId: String,
  userEmail: String,
  animalType: { type: String, enum: ['dog', 'cat', 'bird', 'rabbit', 'other'], default: 'other' },
  petName: String,
  breed: String,
  images: [String],
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verificationNotes: String,
  certificateUrl: String,
  verifiedBy: String,
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BreedVerification', breedVerificationSchema);
