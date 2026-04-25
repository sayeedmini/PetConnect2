const express = require('express');
const BreedVerification = require('../models/BreedVerification');

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const { userId, userEmail, animalType, petName, breed, images } = req.body;
    const verification = new BreedVerification({ userId, userEmail, animalType, petName, breed, images, status: 'pending' });
    await verification.save();
    res.json({ success: true, message: 'Verification request submitted successfully', verification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/pending', async (req, res) => {
  try {
    const verifications = await BreedVerification.find({ status: 'pending' }).sort({ createdAt: 1 });
    res.json({ success: true, count: verifications.length, verifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/request/:id', async (req, res) => {
  try {
    const verification = await BreedVerification.findById(req.params.id);
    if (!verification) return res.status(404).json({ success: false, message: 'Verification request not found' });
    res.json({ success: true, verification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const verifications = await BreedVerification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, verifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/verify/:id', async (req, res) => {
  try {
    const { status, verificationNotes, verifiedBy } = req.body;
    const verification = await BreedVerification.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verificationNotes,
        verifiedBy,
        verifiedAt: new Date(),
        certificateUrl: status === 'verified' ? `https://petconnect.com/certificates/${req.params.id}.pdf` : null,
      },
      { new: true }
    );

    if (!verification) return res.status(404).json({ success: false, message: 'Verification request not found' });
    res.json({ success: true, message: `Verification ${status}`, verification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
