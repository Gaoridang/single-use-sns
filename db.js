import sqlite3 from "sqlite3";
import { resolve } from "path";

// Resolve absolute path to the database file for cross-platform compatibility
const dbPath = resolve("db", "posts.db");
const database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

// Function to insert a new post
export function createPost(post, callback) {
    const { id, type, content, media_path, tags } = post;
    database.run(
        `INSERT INTO posts (id, type, content, media_path, tags) VALUES (?, ?, ?, ?, ?)`,
        [id, type, content, media_path, tags],
        callback,
    );
}

// Function to retrieve paginated posts with metadata
export function getAllPosts(page = 1, limit = 10, callback) {
    // Validate page and limit to prevent SQL injection and invalid queries
    const safePage = Math.max(1, parseInt(page, 10));
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10)), 100); // Cap limit to prevent abuse
    const offset = (safePage - 1) * safeLimit;

    // Query to count total posts
    database.get(`SELECT COUNT(*) as total FROM posts`, (err, countRow) => {
        if (err) {
            return callback(err);
        }
        const totalPosts = countRow.total;

        // Query to fetch paginated posts
        database.all(
            `SELECT * FROM posts ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
            [safeLimit, offset],
            (err, rows) => {
                if (err) {
                    return callback(err);
                }
                // Calculate total pages
                const totalPages = Math.ceil(totalPosts / safeLimit);
                callback(null, {
                    posts: rows,
                    currentPage: safePage,
                    totalPages,
                    totalPosts,
                });
            },
        );
    });
}

// Function to retrieve a post by ID
export function getPostById(id, callback) {
    database.get(`SELECT * FROM posts WHERE id = ?`, [id], callback);
}

// Function to update a post
export function updatePost(id, updates, callback) {
    const { content, tags } = updates;
    database.run(
        `UPDATE posts SET content = ?, tags = ? WHERE id = ?`,
        [content, tags, id],
        callback,
    );
}

// Function to delete a post
export function deletePost(id, callback) {
    database.run(`DELETE FROM posts WHERE id = ?`, [id], callback);
}

export { database };
