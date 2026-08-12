import express from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { getGridFSBucket } from "../../config/gridfs.js";

const router = express.Router();

router.get(
    "/:folder/:filename",
    asyncHandler(async (req, res, next) => {
        const gridFileName = `${req.params.folder}/${req.params.filename}`;

        const bucket = getGridFSBucket();

        const [file] = await bucket
            .find({ filename: gridFileName })
            .limit(1)
            .toArray();

        if (!file) {
            return next();
        }

        const size = file.length;
        const contentType =
            file.metadata?.contentType ||
            file.contentType ||
            "application/octet-stream";

        res.set("Content-Type", contentType);
        res.set("Accept-Ranges", "bytes");

        const pipeStream = (options) => {
            const stream = bucket.openDownloadStreamByName(gridFileName, options);

            stream.on("error", (err) => {
                if (!res.headersSent) {
                    return next(err);
                }
                res.destroy();
            });

            stream.pipe(res);
        };

        const range = req.headers.range;

        if (!range) {
            res.set("Content-Length", size);
            return pipeStream();
        }

        const match = /^bytes=(\d*)-(\d*)$/.exec(range);

        if (!match) {
            res.set("Content-Range", `bytes */${size}`);
            return res.status(416).end();
        }

        let start;
        let end;

        if (match[1] === "" && match[2] !== "") {
            const suffix = parseInt(match[2], 10);

            if (Number.isNaN(suffix) || suffix <= 0) {
                res.set("Content-Range", `bytes */${size}`);
                return res.status(416).end();
            }

            start = Math.max(size - suffix, 0);
            end = size - 1;
        } else {
            start = match[1] === "" ? 0 : parseInt(match[1], 10);
            end = match[2] === "" ? size - 1 : parseInt(match[2], 10);

            if (Number.isNaN(end) || end >= size) {
                end = size - 1;
            }
        }

        if (Number.isNaN(start) || start > end || start >= size) {
            res.set("Content-Range", `bytes */${size}`);
            return res.status(416).end();
        }

        res.status(206);
        res.set("Content-Length", end - start + 1);
        res.set("Content-Range", `bytes ${start}-${end}/${size}`);

        return pipeStream({ start, end });
    })
);

export default router;
