import mongoose from "mongoose";
import News from "../../models/News.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { slugify, generateUniqueSlug } from "../../utils/slugify.js";

export const createNews = asyncHandler(async (req, res) => {
    const { title, slug, ...rest } = req.body;

    const uniqueSlug = await generateUniqueSlug(News, slug || title);

    const news = await News.create({
        ...rest,
        title,
        slug: uniqueSlug,
    });

    res.status(201).json({
        success: true,
        message: "News Created Successfully",
        data: news,
    });
});

export const getAllNews = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const [news, total] = await Promise.all([
        News.find({})
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        News.countDocuments({}),
    ]);

    res.status(200).json({
        success: true,
        message: "News fetched successfully",
        count: news.length,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
        data: news,
    });
});

export const searchNews = asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();

    if (!q) {
        throw new AppError("Search query 'q' is required", 400);
    }

    const news = await News.find({ $text: { $search: q } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    res.status(200).json({
        success: true,
        message: "News search results",
        count: news.length,
        data: news,
    });
});

export const getSingleNews = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const news = isObjectId
        ? await News.findById(id).lean()
        : await News.findOne({ slug: id }).lean();

    if (!news) {
        throw new AppError("News not found", 404);
    }

    res.status(200).json({
        success: true,
        data: news,
    });
});

export const updateNews = asyncHandler(async (req, res) => {
    const news = await News.findById(req.params.id);

    if (!news) {
        throw new AppError("News not found", 404);
    }

    const previousSlug = news.slug;

    Object.assign(news, req.body);

    if (req.body.slug) {
        news.slug = await generateUniqueSlug(News, req.body.slug, news._id);
    } else if (req.body.title && slugify(previousSlug) !== slugify(req.body.title)) {
        news.slug = await generateUniqueSlug(News, req.body.title, news._id);
    }

    await news.save();

    res.status(200).json({
        success: true,
        message: "News Updated Successfully",
        data: news,
    });
});

export const deleteNews = asyncHandler(async (req, res) => {
    const news = await News.findById(req.params.id);

    if (!news) {
        throw new AppError("News not found", 404);
    }

    await news.deleteOne();

    res.status(200).json({
        success: true,
        message: "News Deleted Successfully",
    });
});
