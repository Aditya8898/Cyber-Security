import mongoose from "mongoose";
import Enrollment from "../../models/Enrollment.js";
import Workshop from "../../models/Workshop.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";

export const enrollWorkshop = asyncHandler(async (req, res) => {
    const { workshop } = req.body;

    if (!mongoose.Types.ObjectId.isValid(workshop)) {
        throw new AppError("Invalid workshop id", 400);
    }

    const workshopExists = await Workshop.exists({ _id: workshop });

    if (!workshopExists) {
        throw new AppError("Workshop not found", 404);
    }

    const alreadyEnrolled = await Enrollment.findOne({
        user: req.user._id,
        workshop,
    }).lean();

    if (alreadyEnrolled) {
        throw new AppError("Already enrolled in this workshop", 400);
    }

    const enrollment = await Enrollment.create({
        user: req.user._id,
        workshop,
    });

    res.status(201).json({
        success: true,
        message: "Workshop Enrolled Successfully",
        data: enrollment,
    });
});

export const getMyEnrollments = asyncHandler(async (req, res) => {
    const enrollments = await Enrollment.find({ user: req.user._id })
        .populate("workshop")
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        message: "Enrollments fetched successfully",
        data: enrollments,
    });
});

export const updateProgress = asyncHandler(async (req, res) => {
    const { progress } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
        throw new AppError("Enrollment not found", 404);
    }

    const isOwner = enrollment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        throw new AppError("Not authorized to update this enrollment", 403);
    }

    enrollment.progress = progress;

    if (progress >= 100) {
        enrollment.progress = 100;
        enrollment.completed = true;
        enrollment.completedAt = enrollment.completedAt || new Date();
    }

    await enrollment.save();

    res.status(200).json({
        success: true,
        message: "Progress Updated",
        data: enrollment,
    });
});
