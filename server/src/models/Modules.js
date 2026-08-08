import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
    {
        workshop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workshop",
            required: [true, "Workshop is required"],
            index: true,
        },

        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
        },

        description: {
            type: String,
            required: [true, "Description is required"],
        },

        theory: {
            type: String,
            required: [true, "Theory is required"],
        },

        videoUrl: {
            type: String,
            default: "",
        },

        pdfUrl: {
            type: String,
            default: "",
        },

        order: {
            type: Number,
            required: [true, "Order is required"],
            min: [1, "Order must be a positive number"],
        },

        duration: {
            type: String,
            default: "15 Minutes",
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

moduleSchema.index({ workshop: 1, order: 1 });

const Module = mongoose.model("Module", moduleSchema);

export default Module;
