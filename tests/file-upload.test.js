import request from "supertest";
import app from "../server.js";
import { resolve } from "path";
import { database } from "../db.js";

describe("File Upload API", () => {
    beforeAll((done) => {
        database.serialize(() => {
            database.run("DELETE FROM posts", done);
        });
    });

    afterAll((done) => {
        database.close(done);
    });

    test("POST /posts uploads a photo", async () => {
        const res = await request(app)
            .post("/posts")
            .field("type", "photo")
            .attach("media", resolve("tests/test-image.png"))
            .expect(201);
        expect(res.body).toHaveProperty("id");
        const post = await new Promise((resolve) => {
            database.get("SELECT * FROM posts WHERE id = ?", [res.body.id], (err, row) => {
                resolve(row);
            });
        });
        expect(post.media_path).toContain(".jpg");
    });

    test("POST /posts rejects invalid file type", async () => {
        await request(app)
            .post("/posts")
            .field("type", "photo")
            .attach("media", resolve("tests/test.txt"))
            .expect(400);
    });
});
