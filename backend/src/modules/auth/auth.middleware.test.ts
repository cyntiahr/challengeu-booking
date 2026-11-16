import express from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { authenticate } from "./auth.middleware.js";
import { generateToken } from "./token.js";

process.env.JWT_SECRET = "test-secret-for-authentication-tests";

const app = express();

app.get("/protected", authenticate, (req, res) => {
  res.json({
    userId: req.auth?.userId,
    role: req.auth?.role,
  });
});

describe("Authentication middleware", () => {
  it("should reject requests without a token", async () => {
    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
  });

  it("should reject invalid tokens", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("should allow requests with a valid token", async () => {
    const token = generateToken("student-123", "STUDENT");

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      userId: "student-123",
      role: "STUDENT",
    });
  });
});