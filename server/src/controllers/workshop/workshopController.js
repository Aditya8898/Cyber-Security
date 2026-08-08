import mongoose from "mongoose";
import Workshop from "../../models/Workshop.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { slugify, generateUniqueSlug } from "../../utils/slugify.js";

export const createWorkshop = asyncHandler(async (req, res) => {
    const { title, slug, ...rest } = req.body;

    const uniqueSlug = await generateUniqueSlug(Workshop, slug || title);

    const workshop = await Workshop.create({
        ...rest,
        title,
        slug: uniqueSlug,
    });

    res.status(201).json({
        success: true,
        message: "Workshop Created Successfully",
        data: workshop,
    });
});

export const getAllWorkshops = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const filter = {};

    if (req.query.level) {
        filter.level = req.query.level;
    }

    const [workshops, total] = await Promise.all([
        Workshop.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Workshop.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        message: "Workshops fetched successfully",
        count: workshops.length,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
        data: workshops,
    });
});

export const searchWorkshops = asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();

    if (!q) {
        throw new AppError("Search query 'q' is required", 400);
    }

    const workshops = await Workshop.find({ $text: { $search: q } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    res.status(200).json({
        success: true,
        message: "Workshops search results",
        count: workshops.length,
        data: workshops,
    });
});

export const getSingleWorkshop = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const workshop = isObjectId
        ? await Workshop.findById(id).lean()
        : await Workshop.findOne({ slug: id }).lean();

    if (!workshop) {
        throw new AppError("Workshop not found", 404);
    }

    res.status(200).json({
        success: true,
        data: workshop,
    });
});

export const updateWorkshop = asyncHandler(async (req, res) => {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
        throw new AppError("Workshop not found", 404);
    }

    const previousSlug = workshop.slug;

    Object.assign(workshop, req.body);

    if (req.body.slug) {
        workshop.slug = await generateUniqueSlug(Workshop, req.body.slug, workshop._id);
    } else if (req.body.title && slugify(previousSlug) !== slugify(req.body.title)) {
        workshop.slug = await generateUniqueSlug(Workshop, req.body.title, workshop._id);
    }

    await workshop.save();

    res.status(200).json({
        success: true,
        message: "Workshop Updated Successfully",
        data: workshop,
    });
});

export const deleteWorkshop = asyncHandler(async (req, res) => {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
        throw new AppError("Workshop not found", 404);
    }

    await workshop.deleteOne();

    res.status(200).json({
        success: true,
        message: "Workshop Deleted Successfully",
    });
});
