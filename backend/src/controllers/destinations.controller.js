const Destination = require("../models/Destination");
const AuditLog = require("../models/AuditLog");

exports.getActiveDestinations = async (req, res, next) => {
  try {
    const destinations = await Destination.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      destinations,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminDestinations = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
      ];
    }

    if (status !== undefined && status !== "all") {
      query.isActive = status === "active" || status === "true";
    }

    const destinations = await Destination.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      destinations,
    });
  } catch (error) {
    next(error);
  }
};

exports.createDestination = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      state,
      latitude,
      longitude,
      radiusMeters,
      description,
      isActive,
    } = req.body;

    if (!name || !address || !city || !state || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, address, city, state, latitude, and longitude are required",
      });
    }

    const destination = await Destination.create({
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusMeters: radiusMeters ? parseInt(radiusMeters, 10) : 200,
      description: description ? description.trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: "ADMIN_CREATE_DESTINATION",
      entityType: "Destination",
      entityId: destination._id.toString(),
      ipAddress: req.ip,
      details: { name: destination.name },
    });

    res.status(201).json({
      success: true,
      message: "Destination created successfully",
      destination,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDestination = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      state,
      latitude,
      longitude,
      radiusMeters,
      description,
      isActive,
    } = req.body;

    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found",
      });
    }

    if (name) destination.name = name.trim();
    if (address) destination.address = address.trim();
    if (city) destination.city = city.trim();
    if (state) destination.state = state.trim();
    if (latitude !== undefined) destination.latitude = parseFloat(latitude);
    if (longitude !== undefined) destination.longitude = parseFloat(longitude);
    if (radiusMeters !== undefined) destination.radiusMeters = parseInt(radiusMeters, 10);
    if (description !== undefined) destination.description = description.trim();
    if (isActive !== undefined) destination.isActive = Boolean(isActive);

    await destination.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: "ADMIN_UPDATE_DESTINATION",
      entityType: "Destination",
      entityId: destination._id.toString(),
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Destination updated successfully",
      destination,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found",
      });
    }

    await destination.deleteOne();

    await AuditLog.create({
      actorId: req.user._id,
      action: "ADMIN_DELETE_DESTINATION",
      entityType: "Destination",
      entityId: req.params.id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Destination deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
