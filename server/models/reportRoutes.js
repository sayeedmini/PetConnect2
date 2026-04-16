const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createReport,
  getOpenReports,
  getAcceptedReports,
  acceptReport,
  rejectReport,
  completeReport,
} = require("../controllers/reportcontroller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/", upload.array("media"), createReport);
router.get("/open", getOpenReports);
router.get("/accepted", getAcceptedReports);
router.patch("/:rescueId/accept", acceptReport);
router.patch("/:rescueId/reject", rejectReport);
router.patch("/:rescueId/complete", completeReport);

module.exports = router;
