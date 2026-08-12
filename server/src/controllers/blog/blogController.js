import BlogPost from "../../models/BlogPost.js";
import Comment from "../../models/Comment.js";
import Like from "../../models/Like.js";
import Workshop from "../../models/Workshop.js";
import path from "path";
import crypto from "crypto";
import { getGridFSBucket } from "../../config/gridfs.js";


// CREATE BLOG POST
export const createBlogPost = async (req, res) => {
    try {
        const { title, content, mentionedWorkshop } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required",
            });
        }

        // Validate workshop mention
        if (mentionedWorkshop) {
            const workshop = await Workshop.findById(mentionedWorkshop);

            if (!workshop) {
                return res.status(404).json({
                    success: false,
                    message: "Mentioned workshop not found",
                });
            }
        }

        let image = "";
        if (req.file) {
            const folder = "images";
            const ext = path.extname(req.file.originalname).toLowerCase();
            const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
            const gridFileName = `${folder}/${fileName}`;

            const bucket = getGridFSBucket();

            await new Promise((resolve, reject) => {
                const stream = bucket.openUploadStream(gridFileName, {
                    metadata: {
                        folder,
                        contentType: req.file.mimetype,
                    },
                });

                stream.on("error", reject);
                stream.on("finish", resolve);

                stream.end(req.file.buffer);
            });

            image = `/uploads/${gridFileName}`;
        }

        const post = await BlogPost.create({
            author: req.user._id,
            title,
            content,
            image,
            mentionedWorkshop: mentionedWorkshop || null,
        });

        const populatedPost = await BlogPost.findById(post._id)
            .populate("author", "name profileImage")
            .populate("mentionedWorkshop", "title");

        res.status(201).json({
            success: true,
            message: "Blog Post Created Successfully",
            data: populatedPost,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// GET ALL BLOG POSTS
export const getAllBlogPosts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const posts = await BlogPost.find({
            isPublished: true,
        })
            .populate("author", "name profileImage")
            .populate("mentionedWorkshop", "title")
            .sort({
                isPinned: -1,
                createdAt: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await BlogPost.countDocuments({
            isPublished: true,
        });

        const postIds = posts.map((post) => post._id);

        const likeCounts = await Like.aggregate([
            {
                $match: {
                    post: { $in: postIds },
                },
            },
            {
                $group: {
                    _id: "$post",
                    count: { $sum: 1 },
                },
            },
        ]);

        const commentCounts = await Comment.aggregate([
            {
                $match: {
                    post: { $in: postIds },
                },
            },
            {
                $group: {
                    _id: "$post",
                    count: { $sum: 1 },
                },
            },
        ]);

        const likeMap = {};
        const commentMap = {};

        likeCounts.forEach((item) => {
            likeMap[item._id.toString()] = item.count;
        });

        commentCounts.forEach((item) => {
            commentMap[item._id.toString()] = item.count;
        });

        const finalPosts = posts.map((post) => ({
            ...post,
            likesCount: likeMap[post._id.toString()] || 0,
            commentsCount: commentMap[post._id.toString()] || 0,
        }));

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            data: finalPosts,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// GET SINGLE BLOG POST
export const getSingleBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id)
            .populate("author", "name profileImage")
            .populate("mentionedWorkshop", "title description thumbnail");

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        const likesCount = await Like.countDocuments({
            post: post._id,
        });

        const commentsCount = await Comment.countDocuments({
            post: post._id,
        });

        res.status(200).json({
            success: true,
            data: {
                ...post.toObject(),
                likesCount,
                commentsCount,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// GET MY POSTS
export const getMyBlogPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find({
            author: req.user._id,
        })
            .populate("mentionedWorkshop", "title")
            .sort({ createdAt: -1 })
            .lean();

        const postIds = posts.map((post) => post._id);

        const likeCounts = await Like.aggregate([
            {
                $match: {
                    post: { $in: postIds },
                },
            },
            {
                $group: {
                    _id: "$post",
                    count: { $sum: 1 },
                },
            },
        ]);

        const commentCounts = await Comment.aggregate([
            {
                $match: {
                    post: { $in: postIds },
                },
            },
            {
                $group: {
                    _id: "$post",
                    count: { $sum: 1 },
                },
            },
        ]);

        const likeMap = {};
        const commentMap = {};

        likeCounts.forEach((item) => {
            likeMap[item._id.toString()] = item.count;
        });

        commentCounts.forEach((item) => {
            commentMap[item._id.toString()] = item.count;
        });

        const finalPosts = posts.map((post) => ({
            ...post,
            likesCount: likeMap[post._id.toString()] || 0,
            commentsCount: commentMap[post._id.toString()] || 0,
        }));

        res.status(200).json({
            success: true,
            data: finalPosts,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// DELETE OWN BLOG POST
export const deleteOwnBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can delete only your own post",
            });
        }

        await Comment.deleteMany({
            post: post._id,
        });

        await Like.deleteMany({
            post: post._id,
        });

        await post.deleteOne();

        res.status(200).json({
            success: true,
            message: "Blog Post Deleted Successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// LIKE / UNLIKE
export const toggleLike = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        const existingLike = await Like.findOne({
            post: post._id,
            user: req.user._id,
        });

        if (existingLike) {
            await existingLike.deleteOne();

            const likesCount = await Like.countDocuments({
                post: post._id,
            });

            return res.status(200).json({
                success: true,
                liked: false,
                likesCount,
            });
        }

        await Like.create({
            post: post._id,
            user: req.user._id,
        });

        const likesCount = await Like.countDocuments({
            post: post._id,
        });

        res.status(200).json({
            success: true,
            liked: true,
            likesCount,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ADMIN PIN
export const pinBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        await BlogPost.updateMany(
            { isPinned: true },
            { $set: { isPinned: false } }
        );

        post.isPinned = true;

        await post.save();

        res.status(200).json({
            success: true,
            message: "Blog Post Pinned Successfully",
            data: post,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ADMIN UNPIN
export const unpinBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        post.isPinned = false;

        await post.save();

        res.status(200).json({
            success: true,
            message: "Blog Post Unpinned Successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ADMIN DELETE
export const adminDeleteBlogPost = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        await Comment.deleteMany({
            post: post._id,
        });

        await Like.deleteMany({
            post: post._id,
        });

        await post.deleteOne();

        res.status(200).json({
            success: true,
            message: "Blog Post and all related data deleted successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};