import sqlite3 from "sqlite3";
import { resolve } from "path";

const dbPath = resolve("db", "posts.db");
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM posts", (err, rows) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log(rows);
    }
    db.close();
});
