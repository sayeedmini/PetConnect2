const express = require('express');
const {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/available-slots', protect, getAvailableSlots);
router.get('/my', protect, getMyAppointments);
router.get('/:id', protect, getAppointmentById);
router.post('/', protect, createAppointment);
router.patch('/:id/cancel', protect, cancelAppointment);
router.patch('/:id/reschedule', protect, rescheduleAppointment);
router.patch('/:id/complete', protect, completeAppointment);

module.exports = router;
