import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../../app.js";
import { prisma } from "../../infrastructure/database.js";
import { hashPassword } from "./password.js";

const testEmail = "auth-test@example.com";
const testPassword = "TestPassword123!";

describe("POST /auth/login", () => {
  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    await prisma.user.upsert({
      where: { email: testEmail },
      update: {
        passwordHash,
        status: "ACTIVE",
      },
      create: {
        email: testEmail,
        passwordHash,
        name: "Auth Test Student",
        role: "STUDENT",
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    await prisma.$disconnect();
  });

  it("should return a token for valid credentials", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toMatchObject({
      email: testEmail,
      role: "STUDENT",
    });

    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("should reject an incorrect password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: testEmail,
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(401);
  });

  it("should reject invalid input", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "not-an-email",
        password: "",
      });

    expect(response.status).toBe(400);
  });
});