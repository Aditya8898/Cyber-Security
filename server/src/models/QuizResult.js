import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema(
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

        score: {
            type: Number,
            default: 0,
            min: [0, "Score cannot be negative"],
        },

        totalQuestions: {
            type: Number,
            default: 0,
            min: [0, "Total questions cannot be negative"],
        },

        totalMarks: {
            type: Number,
            default: 0,
            min: [0, "Total marks cannot be negative"],
        },

        passed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

quizResultSchema.index({ user: 1, workshop: 1 });

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

export default QuizResult;
