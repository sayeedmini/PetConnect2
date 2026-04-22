const express = require('express');
const {
  upsertPrescriptionByAppointment,
  getPrescriptionByAppointment,
  getMyPrescriptions,
  verifyPrescriptionByCode,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/my', protect, getMyPrescriptions);
router.get('/verify/:verificationCode', verifyPrescriptionByCode);
router.get('/appointments/:appointmentId', protect, getPrescriptionByAppointment);
router.put('/appointments/:appointmentId', protect, upsertPrescriptionByAppointment);

module.exports = router;
