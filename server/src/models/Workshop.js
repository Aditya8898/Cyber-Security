import mongoose from "mongoose";

const workshopSchema = new mongoose.Schema(
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

        description: {
            type: String,
            required: [true, "Description is required"],
            minlength: [20, "Description must be at least 20 characters"],
        },

        thumbnail: {
            type: String,
            default: "",
        },

        instructor: {
            type: String,
            default: "CEP Team",
        },

        duration: {
            type: String,
            default: "2 Hours",
        },

        level: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner",
            index: true,
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

workshopSchema.index({ isPublished: 1, createdAt: -1 });
workshopSchema.index({ title: "text", shortDescription: "text", description: "text" });

const Workshop = mongoose.model("Workshop", workshopSchema);

export default Workshop;
