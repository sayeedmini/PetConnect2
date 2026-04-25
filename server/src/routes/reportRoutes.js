const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const {
  createReport,
  getOpenReports,
  getAcceptedReports,
  acceptReport,
  rejectReport,
  completeReport,
  updateTracking,
  getTrackingByRescueId,
  getActiveTrackingReports,
  getMonthlyRescueStats,
  markAsSuccessStory,
  getSuccessStories,
  removeSuccessStory,
} = require("../controllers/reportController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", upload.array("media", 5), createReport);

router.get("/open", getOpenReports);
router.get("/accepted", getAcceptedReports);

router.put("/:rescueId/accept", acceptReport);
router.put("/:rescueId/reject", rejectReport);
router.put("/:rescueId/complete", completeReport);

router.put("/:rescueId/tracking", updateTracking);
router.get("/tracking/active/all", getActiveTrackingReports);
router.get("/:rescueId/tracking", getTrackingByRescueId);
router.get("/monthly-stats", getMonthlyRescueStats);
router.put(
  "/:rescueId/success-story",
  upload.single("image"),
  markAsSuccessStory
);
router.get("/success-stories", getSuccessStories);
router.put("/:rescueId/remove-success-story", removeSuccessStory);

module.exports = router;