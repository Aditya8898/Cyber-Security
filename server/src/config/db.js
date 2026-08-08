import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log("MongoDB Connected Successfully");
        console.log(`Database Host: ${connection.connection.host}`);

        mongoose.connection.on("error", (error) => {
            console.error("MongoDB Runtime Error:", error.message);
        });
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        console.warn("Server will continue running in OFFLINE database mode.");
    }
};

export default connectDB;
