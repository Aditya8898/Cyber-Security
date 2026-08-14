import Comment from "../../models/Comment.js";
import BlogPost from "../../models/BlogPost.js";


// ADD COMMENT
export const addComment = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty",
            });
        }

        const post = await BlogPost.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        if (post.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Comments are only allowed on approved posts",
            });
        }

        const comment = await Comment.create({
            post: post._id,
            author: req.user._id,
            content: content.trim(),
        });

        const populatedComment = await Comment.findById(comment._id)
            .populate("author", "name profileImage");

        res.status(201).json({
            success: true,
            message: "Comment Added Successfully",
            data: populatedComment,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// GET COMMENTS
export const getComments = async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        if (post.status !== "approved") {
            return res.status(404).json({
                success: false,
                message: "Blog Post not found",
            });
        }

        const comments = await Comment.find({
            post: req.params.postId,
        })
            .populate("author", "name profileImage")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// DELETE OWN COMMENT
export const deleteOwnComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can delete only your own comment",
            });
        }

        await comment.deleteOne();

        res.status(200).json({
            success: true,
            message: "Comment Deleted Successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ADMIN DELETE COMMENT
export const adminDeleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        await comment.deleteOne();

        res.status(200).json({
            success: true,
            message: "Comment Deleted Successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};