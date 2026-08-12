import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const BUCKET_NAME = "uploads";

export const getGridFSBucket = () => {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Database is not connected. Cannot access file storage.");
    }

    return new GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
};
