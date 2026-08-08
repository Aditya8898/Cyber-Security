import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
    {
        workshop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workshop",
            required: [true, "Workshop is required"],
            index: true,
        },

        question: {
            type: String,
            required: [true, "Question is required"],
            trim: true,
            minlength: [5, "Question must be at least 5 characters"],
        },

        options: {
            type: [
                {
                    type: String,
                    required: true,
                },
            ],
            validate: {
                validator: (value) => value && value.length >= 2,
                message: "At least 2 options are required",
            },
        },

        correctAnswer: {
            type: Number,
            required: [true, "Correct answer is required"],
            min: [0, "Correct answer index cannot be negative"],
        },

        marks: {
            type: Number,
            default: 1,
            min: [1, "Marks must be at least 1"],
        },
    },
    {
        timestamps: true,
    }
);

quizSchema.index({ workshop: 1, createdAt: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
