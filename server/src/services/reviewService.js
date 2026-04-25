const mongoose = require('mongoose');
const Review = require('../models/Review');
const VetClinic = require('../models/VetClinic');

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(value);

const updateClinicRatingStats = async (clinicId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        clinic: toObjectId(clinicId),
        moderationStatus: 'approved',
      },
    },
    {
      $group: {
        _id: '$clinic',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats[0]?.averageRating ? Number(stats[0].averageRating.toFixed(1)) : 0;
  const totalReviews = stats[0]?.totalReviews || 0;

  await VetClinic.findByIdAndUpdate(clinicId, {
    rating: averageRating,
    totalReviews,
  });

  return { averageRating, totalReviews };
};

module.exports = {
  updateClinicRatingStats,
};
