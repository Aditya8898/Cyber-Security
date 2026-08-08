import mongoose from "mongoose";
import Article from "../../models/Article.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { slugify, generateUniqueSlug } from "../../utils/slugify.js";

export const createArticle = asyncHandler(async (req, res) => {
    const { title, slug, ...rest } = req.body;

    const uniqueSlug = await generateUniqueSlug(Article, slug || title);

    const article = await Article.create({
        ...rest,
        title,
        slug: uniqueSlug,
    });

    res.status(201).json({
        success: true,
        message: "Article Created Successfully",
        data: article,
    });
});

export const getAllArticles = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const filter = {};

    if (req.query.category) {
        filter.category = req.query.category;
    }

    const [articles, total] = await Promise.all([
        Article.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Article.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        message: "Articles fetched successfully",
        count: articles.length,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
        data: articles,
    });
});

export const searchArticles = asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();

    if (!q) {
        throw new AppError("Search query 'q' is required", 400);
    }

    const articles = await Article.find({ $text: { $search: q } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    res.status(200).json({
        success: true,
        message: "Articles search results",
        count: articles.length,
        data: articles,
    });
});

export const getSingleArticle = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const article = isObjectId
        ? await Article.findById(id).lean()
        : await Article.findOne({ slug: id }).lean();

    if (!article) {
        throw new AppError("Article not found", 404);
    }

    res.status(200).json({
        success: true,
        data: article,
    });
});

export const updateArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (!article) {
        throw new AppError("Article not found", 404);
    }

    const previousSlug = article.slug;

    Object.assign(article, req.body);

    if (req.body.slug) {
        article.slug = await generateUniqueSlug(Article, req.body.slug, article._id);
    } else if (req.body.title && slugify(previousSlug) !== slugify(req.body.title)) {
        article.slug = await generateUniqueSlug(Article, req.body.title, article._id);
    }

    await article.save();

    res.status(200).json({
        success: true,
        message: "Article Updated Successfully",
        data: article,
    });
});

export const deleteArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);

    if (!article) {
        throw new AppError("Article not found", 404);
    }

    await article.deleteOne();

    res.status(200).json({
        success: true,
        message: "Article Deleted Successfully",
    });
});
