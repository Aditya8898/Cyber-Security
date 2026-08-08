import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
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
        },

        quizResult: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuizResult",
            required: [true, "Quiz result is required"],
            unique: true,
        },

        certificateId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        issuedDate: {
            type: Date,
            default: Date.now,
        },

        pdfUrl: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

certificateSchema.index({ user: 1, createdAt: -1 });
certificateSchema.index({ workshop: 1 });

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
