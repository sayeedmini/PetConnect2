const express = require('express');
const {
  getClinicReviews,
  getMyClinicReview,
  createClinicReview,
  updateMyReview,
  moderateReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/clinics/:clinicId/reviews', getClinicReviews);
router.get('/clinics/:clinicId/reviews/me', protect, getMyClinicReview);
router.post('/clinics/:clinicId/reviews', protect, createClinicReview);
router.patch('/reviews/:reviewId', protect, updateMyReview);
router.patch('/reviews/:reviewId/moderate', protect, moderateReview);

module.exports = router;
