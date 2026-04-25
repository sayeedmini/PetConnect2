const Report = require("../models/Report");

const createReport = async (req, res) => {
  try {
    const { description, locationSource } = req.body;

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    const files = req.files || [];

    const rescueId = "RES-" + Math.floor(100000 + Math.random() * 900000);

    const report = {
      rescueId,
      description,
      lat,
      lng,
      locationSource,
      media: files.map((file) => file.filename),
      status: "Open",
      createdAt: new Date(),
      trackingLogs: [
        {
          eventType: "created",
          message: "Rescue report created",
          lat,
          lng,
          timestamp: new Date(),
        },
      ],
    };

    const savedReport = await Report.create(report);

    console.log("Saved Report:", savedReport);

    const io = req.app.get("io");

    if (io) {
      io.emit("new_rescue_request", {
        rescueId: savedReport.rescueId,
        description: savedReport.description,
        lat: savedReport.lat,
        lng: savedReport.lng,
        status: savedReport.status,
        isNew: true,
        createdAt: savedReport.createdAt,
      });
    }

    res.status(201).json({
      rescueId: savedReport.rescueId,
      status: savedReport.status,
    });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getOpenReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: "Open" }).sort({
      createdAt: -1,
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching open reports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAcceptedReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: "Accepted" }).sort({
      createdAt: -1,
    });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching accepted reports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const acceptReport = async (req, res) => {
  try {
    const { rescueId } = req.params;

    const report = await Report.findOne({ rescueId });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = "Accepted";
    report.acceptedAt = new Date();

    report.trackingLogs.push({
      eventType: "accepted",
      message: "Rescuer accepted the case",
      timestamp: new Date(),
    });

    const updatedReport = await report.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("rescue_status_updated", {
        rescueId: updatedReport.rescueId,
        status: updatedReport.status,
        acceptedAt: updatedReport.acceptedAt,
        trackingLogs: updatedReport.trackingLogs,
      });
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("Error accepting report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const rejectReport = async (req, res) => {
  try {
    const { rescueId } = req.params;

    const report = await Report.findOne({ rescueId });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = "Rejected";

    report.trackingLogs.push({
      eventType: "rejected",
      message: "Rescuer rejected the case",
      timestamp: new Date(),
    });

    const updatedReport = await report.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("rescue_status_updated", {
        rescueId: updatedReport.rescueId,
        status: updatedReport.status,
        trackingLogs: updatedReport.trackingLogs,
      });
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("Error rejecting report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const completeReport = async (req, res) => {
  try {
    const { rescueId } = req.params;

    const report = await Report.findOne({ rescueId });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = "Completed";
    report.completedAt = new Date();

    report.trackingLogs.push({
      eventType: "completed",
      message: "Rescue completed successfully",
      timestamp: new Date(),
    });

    const updatedReport = await report.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("rescue_completed", {
        rescueId: updatedReport.rescueId,
        status: updatedReport.status,
        completedAt: updatedReport.completedAt,
        trackingLogs: updatedReport.trackingLogs,
      });

      io.emit("rescue_status_updated", {
        rescueId: updatedReport.rescueId,
        status: updatedReport.status,
        completedAt: updatedReport.completedAt,
        trackingLogs: updatedReport.trackingLogs,
      });
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("Error completing report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTracking = async (req, res) => {
  try {
    const { rescueId } = req.params;
    const { currentRescuerLat, currentRescuerLng, message, status } = req.body;

    const report = await Report.findOne({ rescueId });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const hasValidLocation =
      currentRescuerLat !== undefined &&
      currentRescuerLng !== undefined &&
      !isNaN(parseFloat(currentRescuerLat)) &&
      !isNaN(parseFloat(currentRescuerLng));

    if (hasValidLocation) {
      report.currentRescuerLat = parseFloat(currentRescuerLat);
      report.currentRescuerLng = parseFloat(currentRescuerLng);

      report.trackingLogs.push({
        eventType: "location_update",
        message: message || "Rescuer location updated",
        lat: parseFloat(currentRescuerLat),
        lng: parseFloat(currentRescuerLng),
        timestamp: new Date(),
      });
    }

    if (status) {
      report.status = status;

      report.trackingLogs.push({
        eventType: "status_update",
        message: `Rescue status updated to ${status}`,
        timestamp: new Date(),
      });

      if (status === "Completed" && !report.completedAt) {
        report.completedAt = new Date();
      }
    }

    const updatedReport = await report.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("tracking_updated", {
        rescueId: updatedReport.rescueId,
        status: updatedReport.status,
        currentRescuerLat: updatedReport.currentRescuerLat,
        currentRescuerLng: updatedReport.currentRescuerLng,
        trackingLogs: updatedReport.trackingLogs,
      });

      if (status) {
        io.emit("rescue_status_updated", {
          rescueId: updatedReport.rescueId,
          status: updatedReport.status,
          completedAt: updatedReport.completedAt || null,
          trackingLogs: updatedReport.trackingLogs,
        });

        if (status === "Completed") {
          io.emit("rescue_completed", {
            rescueId: updatedReport.rescueId,
            status: updatedReport.status,
            completedAt: updatedReport.completedAt,
            trackingLogs: updatedReport.trackingLogs,
          });
        }
      }
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("Error updating tracking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTrackingByRescueId = async (req, res) => {
  try {
    const { rescueId } = req.params;

    const report = await Report.findOne({ rescueId });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching tracking by rescueId:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getActiveTrackingReports = async (req, res) => {
  try {
    const reports = await Report.find({
      status: { $in: ["Open", "Accepted"] },
    }).sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching active tracking reports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMonthlyRescueStats = async (req, res) => {
  try {
    const monthlyStats = await Report.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRescues: { $sum: 1 },
          completedRescues: {
            $sum: {
              $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
            },
          },
          rejectedRescues: {
            $sum: {
              $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const formattedStats = monthlyStats.map((item) => {
      const monthDate = new Date(item._id.year, item._id.month - 1);

      return {
        month: monthDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        year: item._id.year,
        monthNumber: item._id.month,
        totalRescues: item.totalRescues,
        completedRescues: item.completedRescues,
        rejectedRescues: item.rejectedRescues,
      };
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    console.error("Error fetching monthly rescue stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const markAsSuccessStory = async (req, res) => {
  try {
    const { rescueId } = req.params;

    const storyTitle = req.body.storyTitle;
    const storyDescription = req.body.storyDescription;

    const file = req.file;

    const report = await Report.findOne({ rescueId });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.status !== "Completed") {
      return res.status(400).json({
        message: "Only completed rescues can be marked as success stories",
      });
    }

    report.isSuccessStory = true;

    if (storyTitle) report.storyTitle = storyTitle;
    if (storyDescription) report.storyDescription = storyDescription;

    if (file) {
      report.featuredImage = file.filename;
    }

    const updatedReport = await report.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("success_story_added", updatedReport);
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("Error marking success story:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getSuccessStories = async (req, res) => {
  try {
    const stories = await Report.find({
      status: "Completed",
      isSuccessStory: true,
    }).sort({ completedAt: -1 });

    res.status(200).json(stories);
  } catch (error) {
    console.error("Error fetching success stories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const removeSuccessStory = async (req, res) => {
  try {
    const { rescueId } = req.params;

    const report = await Report.findOne({ rescueId });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.isSuccessStory = false;
    report.storyTitle = "";
    report.storyDescription = "";
    report.featuredImage = "";

    const updatedReport = await report.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("success_story_removed", {
        rescueId: updatedReport.rescueId,
      });
    }

    res.status(200).json({
      message: "Success story removed from gallery",
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error removing success story:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
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
};