const VetClinic = require('../models/VetClinic');

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseLocationPayload = (body) => {
  const latitude = parseNumber(body.latitude);
  const longitude = parseNumber(body.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
};

const convertClinicPayload = (body) => {
  const location = parseLocationPayload(body);

  return {
    clinicName: body.clinicName,
    address: body.address,
    contactNumber: body.contactNumber,
    servicesOffered: Array.isArray(body.servicesOffered) ? body.servicesOffered : [],
    workingHours: {
      openTime: body.openTime,
      closeTime: body.closeTime,
    },
    consultationFee: Number(body.consultationFee),
    rating: Number(body.rating || 0),
    ...(location ? { location } : {}),
  };
};

const timeToMinutes = (value = '') => {
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const addDerivedFields = (clinic) => {
  const plainClinic = typeof clinic.toObject === 'function' ? clinic.toObject() : { ...clinic };
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(plainClinic?.workingHours?.openTime);
  const closeMinutes = timeToMinutes(plainClinic?.workingHours?.closeTime);

  let isOpenNow = false;
  if (openMinutes !== null && closeMinutes !== null) {
    isOpenNow = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return {
    ...plainClinic,
    latitude: plainClinic?.location?.coordinates?.[1] ?? null,
    longitude: plainClinic?.location?.coordinates?.[0] ?? null,
    isOpenNow,
  };
};

const getAllVetClinics = async (req, res) => {
  try {
    const { search, service, minRating, lat, lng, radiusKm } = req.query;

    const ratingFilter = parseNumber(minRating);
    const latitude = parseNumber(lat);
    const longitude = parseNumber(lng);
    const radiusMeters = parseNumber(radiusKm) ? Number(radiusKm) * 1000 : null;

    const matchStage = {};

    if (ratingFilter !== null) {
      matchStage.rating = { $gte: ratingFilter };
    }

    if (service) {
      matchStage.servicesOffered = { $regex: service, $options: 'i' };
    }

    if (search) {
      matchStage.$or = [
        { clinicName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { servicesOffered: { $regex: search, $options: 'i' } },
      ];
    }

    let clinics;

    if (latitude !== null && longitude !== null) {
      clinics = await VetClinic.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distanceInMeters',
            maxDistance: radiusMeters || undefined,
            spherical: true,
          },
        },
        { $match: matchStage },
        { $sort: { distanceInMeters: 1, createdAt: -1 } },
      ]);
    } else {
      clinics = await VetClinic.find(matchStage)
        .populate('owner', 'name email role')
        .sort({ createdAt: -1 });
    }

    const enrichedClinics = clinics.map((clinic) => {
      const enriched = addDerivedFields(clinic);
      return {
        ...enriched,
        distanceKm:
          clinic.distanceInMeters !== undefined
            ? Number((clinic.distanceInMeters / 1000).toFixed(2))
            : null,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedClinics.length,
      data: enrichedClinics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vet clinics',
      error: error.message,
    });
  }
};

const getVetClinicById = async (req, res) => {
  try {
    const clinic = await VetClinic.findById(req.params.id).populate('owner', 'name email role');

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Vet clinic not found',
      });
    }

    res.status(200).json({
      success: true,
      data: addDerivedFields(clinic),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vet clinic',
      error: error.message,
    });
  }
};

const createVetClinic = async (req, res) => {
  try {
    const clinicPayload = convertClinicPayload(req.body);

    const clinic = await VetClinic.create({
      ...clinicPayload,
      owner: req.user._id,
    });

    const populatedClinic = await VetClinic.findById(clinic._id).populate('owner', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Vet clinic created successfully',
      data: addDerivedFields(populatedClinic),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create vet clinic',
      error: error.message,
    });
  }
};

const updateVetClinic = async (req, res) => {
  try {
    const clinic = await VetClinic.findByIdAndUpdate(
      req.params.id,
      convertClinicPayload(req.body),
      {
        new: true,
        runValidators: true,
      }
    ).populate('owner', 'name email role');

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Vet clinic not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vet clinic updated successfully',
      data: addDerivedFields(clinic),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update vet clinic',
      error: error.message,
    });
  }
};

const deleteVetClinic = async (req, res) => {
  try {
    const clinic = await VetClinic.findByIdAndDelete(req.params.id);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Vet clinic not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vet clinic deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete vet clinic',
      error: error.message,
    });
  }
};

module.exports = {
  getAllVetClinics,
  getVetClinicById,
  createVetClinic,
  updateVetClinic,
  deleteVetClinic,
};