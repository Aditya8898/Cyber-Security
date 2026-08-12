import multer from "multer";
import AppError from "../utils/AppError.js";

const ALLOWED_MIME = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(new AppError("Only images and PDF files are allowed", 400));
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;
