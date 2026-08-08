import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";

export const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError("No file uploaded", 400);
    }

    const webPath = "/" + req.file.path.replace(/\\/g, "/");

    const fullUrl = `${req.protocol}://${req.get("host")}${webPath}`;

    res.status(200).json({
        success: true,
        message: "File Uploaded Successfully",
        file: req.file.filename,
        path: webPath,
        url: fullUrl,
    });
});
