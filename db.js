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

// Function to retrieve all posts
export function getAllPosts(callback) {
    database.all(`SELECT * FROM posts ORDER BY timestamp DESC`, callback);
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
