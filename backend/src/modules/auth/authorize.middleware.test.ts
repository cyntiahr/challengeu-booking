import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { authenticate } from "./auth.middleware.js";
import { authorize } from "./authorize.middleware.js";
import { generateToken } from "./token.js";

process.env.JWT_SECRET = "test-secret-for-authentication-tests";

const app = express();

app.get(
  "/coach-only",
  authenticate,
  authorize("COACH"),
  (_req, res) => {
    res.json({ message: "Welcome, coach!" });
  }
);

describe("Authorization middleware", () => {
  it("should reject a student accessing a coach-only route", async () => {
    const token = generateToken("student-123", "STUDENT");

    const response = await request(app)
      .get("/coach-only")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("should allow a coach to access a coach-only route", async () => {
    const token = generateToken("coach-123", "COACH");

    const response = await request(app)
      .get("/coach-only")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Welcome, coach!");
  });

  it("should reject requests without authentication", async () => {
    const response = await request(app).get("/coach-only");

    expect(response.status).toBe(401);
  });
});