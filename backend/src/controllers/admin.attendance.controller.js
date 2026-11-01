const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Destination = require("../models/Destination");

exports.getAttendanceRecords = async (req, res, next) => {
  try {
    const {
      search,
      userId,
      destinationId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (destinationId) {
      query.destinationId = destinationId;
    }

    if (startDate || endDate) {
      query["checkIn.timestamp"] = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query["checkIn.timestamp"].$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query["checkIn.timestamp"].$lte = end;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedUsers = await User.find({
        $or: [
          { name: searchRegex },
          { employeeId: searchRegex },
          { email: searchRegex },
        ],
      }).select("_id");

      const userIds = matchedUsers.map((u) => u._id);
      query.$or = [
        { userId: { $in: userIds } },
        { purpose: searchRegex },
        { customDestination: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .sort({ "checkIn.timestamp": -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "name employeeId email mobile department designation")
        .populate("destinationId")
        .lean(),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceById = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id)
      .populate("userId", "name employeeId email mobile department designation")
      .populate("destinationId");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      currentlyCheckedIn,
      todayCheckIns,
      todayCheckOuts,
      recentRecords,
      destBreakdown,
      sevenDayTrend,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isActive: true }),
      Attendance.countDocuments({ status: "checked_in" }),
      Attendance.countDocuments({
        "checkIn.timestamp": { $gte: startOfToday },
      }),
      Attendance.countDocuments({
        status: "checked_out",
        "checkOut.timestamp": { $gte: startOfToday },
      }),
      Attendance.find()
        .sort({ "checkIn.timestamp": -1 })
        .limit(6)
        .populate("userId", "name employeeId department")
        .populate("destinationId", "name")
        .lean(),
      Attendance.aggregate([
        {
          $group: {
            _id: "$destinationId",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Attendance.aggregate([
        {
          $match: {
            "checkIn.timestamp": { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$checkIn.timestamp" },
            },
            checkIns: { $sum: 1 },
            checkOuts: {
              $sum: { $cond: [{ $eq: ["$status", "checked_out"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Populate destination names for destination breakdown
    const destinationStats = await Promise.all(
      destBreakdown.map(async (item) => {
        if (!item._id) {
          return { name: "Custom Locations", count: item.count };
        }
        const dest = await Destination.findById(item._id).select("name");
        return { name: dest ? dest.name : "Unknown", count: item.count };
      })
    );

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        currentlyCheckedIn,
        todayCheckIns,
        todayCheckOuts,
        recentRecords,
        destinationStats,
        sevenDayTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.exportAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find()
      .sort({ "checkIn.timestamp": -1 })
      .populate("userId", "name employeeId department designation")
      .populate("destinationId", "name")
      .lean();

    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Designation",
      "Destination",
      "Purpose",
      "Remarks",
      "Status",
      "Check-In Date",
      "Check-In Time",
      "Check-In Latitude",
      "Check-In Longitude",
      "Check-In Address",
      "Check-Out Date",
      "Check-Out Time",
      "Check-Out Latitude",
      "Check-Out Longitude",
      "Check-Out Address",
      "Duration (Minutes)",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((r) => {
      const u = r.userId || {};
      const destName = r.destinationId ? r.destinationId.name : r.customDestination || "N/A";
      const cin = r.checkIn || {};
      const cout = r.checkOut || {};

      const cinDate = cin.timestamp ? new Date(cin.timestamp).toISOString().split("T")[0] : "";
      const cinTime = cin.timestamp
        ? new Date(cin.timestamp).toTimeString().split(" ")[0]
        : "";

      const coutDate = cout.timestamp
        ? new Date(cout.timestamp).toISOString().split("T")[0]
        : "";
      const coutTime = cout.timestamp
        ? new Date(cout.timestamp).toTimeString().split(" ")[0]
        : "";

      return [
        escapeCsv(u.employeeId || ""),
        escapeCsv(u.name || ""),
        escapeCsv(u.department || ""),
        escapeCsv(u.designation || ""),
        escapeCsv(destName),
        escapeCsv(r.purpose || ""),
        escapeCsv(r.remarks || ""),
        escapeCsv(r.status || ""),
        escapeCsv(cinDate),
        escapeCsv(cinTime),
        escapeCsv(cin.latitude || ""),
        escapeCsv(cin.longitude || ""),
        escapeCsv(cin.address || ""),
        escapeCsv(coutDate),
        escapeCsv(coutTime),
        escapeCsv(cout.latitude || ""),
        escapeCsv(cout.longitude || ""),
        escapeCsv(cout.address || ""),
        escapeCsv(r.durationMinutes !== null ? r.durationMinutes : ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_report_${Date.now()}.csv`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
