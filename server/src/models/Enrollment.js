import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },

        workshop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workshop",
            required: [true, "Workshop is required"],
            index: true,
        },

        progress: {
            type: Number,
            default: 0,
            min: [0, "Progress cannot be less than 0"],
            max: [100, "Progress cannot be more than 100"],
        },

        completed: {
            type: Boolean,
            default: false,
        },

        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

enrollmentSchema.index({ user: 1, workshop: 1 }, { unique: true });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
