import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import { createPost, getAllPosts, getPostById, updatePost, deletePost, database } from "./db.js";
import { upload } from "./fileHandler.js";
import sharp from "sharp";
import { resolve } from "path";
import { unlink } from "fs/promises";
import logger from "./logger.js";
import { validatePost } from "./validate.js";
import multer from "multer";

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(bodyParser.json());
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 100,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.error(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({ error: "Too many requests, please try again later." });
        },
    }),
);
app.use("/media", express.static(resolve("uploads")));

app.get("/", (req, res) => {
    logger.info("Accessed root endpoint");
    res.send("Backend server is running");
});

app.post("/posts", validatePost, upload.single("media"), async (req, res) => {
    const { type, content, tags } = req.body;
    if (type === "text" && !content) {
        logger.error("Content missing for text post");
        return res.status(400).json({ error: "Content required for text posts" });
    }
    if (["photo", "video"].includes(type) && !req.file) {
        logger.error("File missing for photo/video post");
        return res.status(400).json({ error: "File is required for photo or video posts" });
    }

    let media_path = null;
    if (req.file) {
        if (type === "photo") {
            const filename = `${uuidv4()}.jpg`;
            const outputPath = resolve("uploads", filename);
            try {
                logger.info("Starting image processing");
                console.time("image-processing");
                await sharp(req.file.path)
                    .resize({ width: 1080, withoutEnlargement: true })
                    .toFormat("jpeg")
                    .toFile(outputPath);
                console.timeEnd("image-processing");
                logger.info("Image processing completed");
                media_path = filename;
                await unlink(req.file.path).catch((err) => {
                    logger.error(`Failed to delete original file: ${err.message}`);
                });
            } catch (error) {
                logger.error(`Image processing failed: ${error.message}`);
                return res.status(500).json({ error: `Image processing failed: ${error.message}` });
            }
        } else {
            media_path = req.file.filename;
        }
    }

    const post = {
        id: uuidv4(),
        type,
        content: content || null,
        media_path,
        tags: tags ? tags.join(",") : null,
    };

    createPost(post, (err) => {
        if (err) {
            logger.error(`Database error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        logger.info(`Created post with ID: ${post.id}`);
        res.status(201).json({ id: post.id });
    });
});

app.get("/posts", (req, res) => {
    getAllPosts((err, rows) => {
        if (err) {
            logger.error(`Database error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        const enhancedRows = rows.map((row) => ({
            ...row,
            media_url: row.media_path ? `/media/${row.media_path}` : null,
        }));
        logger.info("Retrieved all posts");
        res.json(enhancedRows);
    });
});

app.get("/posts/:id", (req, res) => {
    const { id } = req.params;
    getPostById(id, (err, row) => {
        if (err) {
            logger.error(`Database error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            logger.error(`Post not found: ${id}`);
            return res.status(404).json({ error: "Post not found" });
        }
        const enhancedRow = {
            ...row,
            media_url: row.media_path ? `/media/${row.media_path}` : null,
        };
        logger.info(`Retrieved post: ${id}`);
        res.json(enhancedRow);
    });
});

app.put("/posts/:id", validatePost, (req, res) => {
    const { id } = req.params;
    const { content, tags } = req.body;
    if (!content && !tags) {
        logger.error("No updates provided for PUT request");
        return res.status(400).json({ error: "No updates provided" });
    }

    updatePost(id, { content, tags: tags ? tags.join(",") : null }, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Post not found" });
        logger.info(`Updated post: ${id}`);
        res.json({ message: "Post updated" });
    });
});

app.delete("/posts/:id", (req, res) => {
    const { id } = req.params;
    deletePost(id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Post not found" });
        logger.info(`Deleted post: ${id}`);
        res.json({ message: "Post deleted" });
    });
});

app.use((err, req, res, next) => {
    // Normalize Multer/file-type validation errors to 400
    if (err instanceof multer.MulterError || (err.message && /file type/i.test(err.message))) {
        logger.error(`File upload error: ${err.message}`);
        return res.status(400).json({ error: err.message });
    }
    logger.error(`Unhandled error: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: "Internal server error" });
});

// Only start the HTTP listener when not under test
if (process.env.JEST_WORKER_ID === undefined) {
    app.listen(port, "0.0.0.0", () => {
        logger.info(`Server listening on port ${port}`);
    });
}

process.on("SIGINT", () => {
    logger.info("Shutting down server");
    database.close((err) => {
        if (err) {
            logger.error(`Database close error: ${err.message}`);
        }
        logger.info("Database connection closed.");
        process.exit(0);
    });
});

export default app;
