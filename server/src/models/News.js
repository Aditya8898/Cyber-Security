import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [200, "Title must be at most 200 characters"],
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },

        shortDescription: {
            type: String,
            required: [true, "Short description is required"],
            minlength: [10, "Short description must be at least 10 characters"],
        },

        content: {
            type: String,
            required: [true, "Content is required"],
            minlength: [20, "Content must be at least 20 characters"],
        },

        coverImage: {
            type: String,
            default: "",
        },

        source: {
            type: String,
            default: "",
        },

        author: {
            type: String,
            default: "Admin",
        },

        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

newsSchema.index({ isPublished: 1, createdAt: -1 });
newsSchema.index({ title: "text", shortDescription: "text", content: "text" });

const News = mongoose.model("News", newsSchema);

export default News;
