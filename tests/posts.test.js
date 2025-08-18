import request from "supertest";
import app from "../server.js";
import { database } from "../db.js";

describe("Posts API", () => {
    beforeAll((done) => {
        // Clear database for clean slate
        database.serialize(() => {
            database.run("DELETE FROM posts", done);
        });
    });

    afterAll((done) => {
        database.close(done);
    });

    test("POST /posts creates a text post", async () => {
        const res = await request(app)
            .post("/posts")
            .send({ type: "text", content: "Test post", tags: ["test"] })
            .expect(201);
        expect(res.body).toHaveProperty("id");
    });

    test("POST /posts rejects invalid type", async () => {
        const res = await request(app).post("/posts").send({ type: "invalid" }).expect(400);
        expect(res.body.error).toContain("type");
    });

    test("GET /posts retrieves all posts", async () => {
        await request(app).post("/posts").send({ type: "text", content: "Test post" });
        const res = await request(app).get("/posts").expect(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("GET /posts/:id retrieves a post", async () => {
        const postRes = await request(app)
            .post("/posts")
            .send({ type: "text", content: "Test post" });
        const id = postRes.body.id;
        const res = await request(app).get(`/posts/${id}`).expect(200);
        expect(res.body.id).toBe(id);
    });

    test("PUT /posts/:id updates a post", async () => {
        const postRes = await request(app)
            .post("/posts")
            .send({ type: "text", content: "Original" });
        const id = postRes.body.id;
        await request(app)
            .put(`/posts/${id}`)
            .send({ content: "Updated", tags: ["new"] })
            .expect(200);
    });

    test("DELETE /posts/:id deletes a post", async () => {
        const postRes = await request(app)
            .post("/posts")
            .send({ type: "text", content: "To delete" });
        const id = postRes.body.id;
        await request(app).delete(`/posts/${id}`).expect(200);
        await request(app).get(`/posts/${id}`).expect(404);
    });
});
