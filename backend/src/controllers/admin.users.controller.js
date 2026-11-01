const User = require("../models/User");
const Attendance = require("../models/Attendance");
const AuditLog = require("../models/AuditLog");

exports.createUser = async (req, res, next) => {
  try {
    const { name, employeeId, email, mobile, department, designation, password, role } =
      req.body;

    if (!name || !employeeId || !email || !mobile || !department || !designation || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields including password are required",
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const existingId = await User.findOne({
      employeeId: employeeId.toUpperCase().trim(),
    });
    if (existingId) {
      return res.status(409).json({
        success: false,
        message: "A user with this Employee ID already exists",
      });
    }

    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      name: name.trim(),
      employeeId: employeeId.toUpperCase().trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      department: department.trim(),
      designation: designation.trim(),
      passwordHash,
      role: role === "admin" ? "admin" : "user",
      isActive: true,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: "ADMIN_CREATE_USER",
      entityType: "User",
      entityId: newUser._id.toString(),
      ipAddress: req.ip,
      details: {
        createdEmployeeId: newUser.employeeId,
        createdEmail: newUser.email,
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        employeeId: newUser.employeeId,
        email: newUser.email,
        mobile: newUser.mobile,
        department: newUser.department,
        designation: newUser.designation,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { employeeId: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
      ];
    }

    if (department && department !== "all") {
      query.department = department;
    }

    if (status !== undefined && status !== "all") {
      query.isActive = status === "active" || status === "true";
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Distinct departments for filter dropdown
    const departments = await User.distinct("department");

    res.status(200).json({
      success: true,
      users,
      departments,
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

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const attendanceStats = await Attendance.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalMinutes: { $sum: "$durationMinutes" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      user,
      attendanceStats,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, mobile, department, designation } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) user.name = name.trim();
    if (mobile) user.mobile = mobile.trim();
    if (department) user.department = department.trim();
    if (designation) user.designation = designation.trim();

    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: "ADMIN_UPDATE_USER",
      entityType: "User",
      entityId: user._id.toString(),
      ipAddress: req.ip,
      details: { updatedFields: { name, mobile, department, designation } },
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = isActive;
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: isActive ? "ADMIN_ACTIVATE_USER" : "ADMIN_DEACTIVATE_USER",
      entityType: "User",
      entityId: user._id.toString(),
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: "ADMIN_RESET_USER_PASSWORD",
      entityType: "User",
      entityId: user._id.toString(),
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};
