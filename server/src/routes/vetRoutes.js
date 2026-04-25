const express = require('express');
const {
  getAllVetClinics,
  getVetClinicById,
  createVetClinic,
  updateVetClinic,
  deleteVetClinic,
} = require('../controllers/vetController');

const {
  protect,
  authorize,
  verifyVetClinicOwner,
} = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllVetClinics);
router.get('/:id', getVetClinicById);

router.post('/', protect, authorize('vet', 'admin'), createVetClinic);
router.put('/:id', protect, authorize('vet', 'admin'), verifyVetClinicOwner, updateVetClinic);
router.delete('/:id', protect, authorize('vet', 'admin'), verifyVetClinicOwner, deleteVetClinic);

module.exports = router;