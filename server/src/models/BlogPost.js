import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        content: {
            type: String,
            required: true,
        },

        image: {
            type: String,
            default: "",
        },

        mentionedWorkshop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workshop",
            default: null,
        },

        isPinned: {
            type: Boolean,
            default: false,
        },

        isPublished: {
            type: Boolean,
            default: true,
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;