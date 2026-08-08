import mongoose from "mongoose";
import Module from "../../models/Modules.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";

export const createModule = asyncHandler(async (req, res) => {
    const module = await Module.create(req.body);

    res.status(201).json({
        success: true,
        message: "Module Created Successfully",
        data: module,
    });
});

export const getAllModules = asyncHandler(async (req, res) => {
    const modules = await Module.find()
        .populate("workshop", "title")
        .sort({ order: 1 })
        .lean();

    res.status(200).json({
        success: true,
        message: "Modules fetched successfully",
        count: modules.length,
        data: modules,
    });
});

export const getModulesByWorkshop = asyncHandler(async (req, res) => {
    const { workshopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(workshopId)) {
        throw new AppError("Invalid workshop id", 400);
    }

    const modules = await Module.find({ workshop: workshopId })
        .sort({ order: 1 })
        .lean();

    res.status(200).json({
        success: true,
        message: "Modules fetched successfully",
        count: modules.length,
        data: modules,
    });
});

export const getSingleModule = asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id)
        .populate("workshop", "title")
        .lean();

    if (!module) {
        throw new AppError("Module not found", 404);
    }

    res.status(200).json({
        success: true,
        data: module,
    });
});

export const updateModule = asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id);

    if (!module) {
        throw new AppError("Module not found", 404);
    }

    Object.assign(module, req.body);

    await module.save();

    res.status(200).json({
        success: true,
        message: "Module Updated Successfully",
        data: module,
    });
});

export const deleteModule = asyncHandler(async (req, res) => {
    const module = await Module.findById(req.params.id);

    if (!module) {
        throw new AppError("Module not found", 404);
    }

    await module.deleteOne();

    res.status(200).json({
        success: true,
        message: "Module Deleted Successfully",
    });
});
