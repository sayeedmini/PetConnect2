const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const { updateClinicRatingStats } = require('../services/reviewService');

const findEligibleCompletedAppointment = async ({ clinicId, userId }) => {
  return Appointment.findOne({
    clinic: clinicId,
    petOwner: userId,
    status: 'completed',
  }).sort({ endTime: -1 });
};

const getClinicReviews = async (req, res) => {
  try {
    const includeRejected = req.user?.role === 'admin' && req.query.includeRejected === 'true';
    const query = {
      clinic: req.params.clinicId,
      ...(includeRejected ? {} : { moderationStatus: 'approved' }),
    };

    const reviews = await Review.find(query)
      .populate('reviewer', 'name role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch clinic reviews',
      error: error.message,
    });
  }
};

const getMyClinicReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      clinic: req.params.clinicId,
      reviewer: req.user._id,
    }).populate('reviewer', 'name role');

    const eligibleAppointment = await findEligibleCompletedAppointment({
      clinicId: req.params.clinicId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      data: {
        review,
        canReview: Boolean(eligibleAppointment),
        reason: eligibleAppointment
          ? ''
          : 'You can review this clinic after completing at least one appointment.',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your review status',
      error: error.message,
    });
  }
};

const createClinicReview = async (req, res) => {
  try {
    if (!['petOwner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only pet owners or admin can submit reviews',
      });
    }

    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required',
      });
    }

    const existingReview = await Review.findOne({
      clinic: req.params.clinicId,
      reviewer: req.user._id,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this clinic. Please edit your existing review.',
      });
    }

    const eligibleAppointment = await findEligibleCompletedAppointment({
      clinicId: req.params.clinicId,
      userId: req.user._id,
    });

    if (!eligibleAppointment) {
      return res.status(403).json({
        success: false,
        message: 'You can review a clinic only after completing an appointment there',
      });
    }

    const review = await Review.create({
      clinic: req.params.clinicId,
      reviewer: req.user._id,
      appointment: eligibleAppointment._id,
      rating: Number(rating),
      comment: comment || '',
    });

    await updateClinicRatingStats(req.params.clinicId);

    const populatedReview = await Review.findById(review._id).populate('reviewer', 'name role');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: populatedReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message,
    });
  }
};

const updateMyReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const isReviewer = review.reviewer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isReviewer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this review',
      });
    }

    if (req.body.rating !== undefined) {
      review.rating = Number(req.body.rating);
    }

    if (req.body.comment !== undefined) {
      review.comment = req.body.comment;
    }

    await review.save();
    await updateClinicRatingStats(review.clinic);

    const populatedReview = await Review.findById(review._id).populate('reviewer', 'name role');

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: populatedReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

const moderateReview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can moderate reviews',
      });
    }

    const { moderationStatus, adminNote } = req.body;
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (!['approved', 'rejected'].includes(moderationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'moderationStatus must be approved or rejected',
      });
    }

    review.moderationStatus = moderationStatus;
    review.adminNote = adminNote || '';
    await review.save();
    await updateClinicRatingStats(review.clinic);

    const populatedReview = await Review.findById(review._id).populate('reviewer', 'name role');

    return res.status(200).json({
      success: true,
      message: 'Review moderated successfully',
      data: populatedReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to moderate review',
      error: error.message,
    });
  }
};

module.exports = {
  getClinicReviews,
  getMyClinicReview,
  createClinicReview,
  updateMyReview,
  moderateReview,
};
