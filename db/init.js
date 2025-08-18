import sqlite3 from "sqlite3";
import { resolve } from "path";

const dbPath = resolve("db", "posts.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            content TEXT,
            media_path TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            tags TEXT
        )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts (timestamp)`);
});

db.close();
