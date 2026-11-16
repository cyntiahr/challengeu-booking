import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../../app.js";
import { prisma } from "../../infrastructure/database.js";
import { generateToken } from "../auth/token.js";

process.env.JWT_SECRET = "test-secret-for-authentication-tests";

describe("POST /availability", () => {
  let coachId: string;
  let studentId: string;
  let coachToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const coach = await prisma.user.create({
      data: {
        email: "availability-api-coach@example.com",
        passwordHash: "test-hash",
        name: "API Test Coach",
        role: "COACH",
      },
    });

    const student = await prisma.user.create({
      data: {
        email: "availability-api-student@example.com",
        passwordHash: "test-hash",
        name: "API Test Student",
        role: "STUDENT",
      },
    });

    coachId = coach.id;
    studentId = student.id;

    coachToken = generateToken(coachId, "COACH");
    studentToken = generateToken(studentId, "STUDENT");
  });

  afterAll(async () => {
    await prisma.availabilityBlock.deleteMany({
      where: { coachId },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [coachId, studentId] },
      },
    });

    await prisma.$disconnect();
  });

  it("should allow a coach to create availability", async () => {
    const response = await request(app)
      .post("/availability")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({
        startAt: "2026-11-25T14:00:00.000Z",
        durationMinutes: 60,
      });

    expect(response.status).toBe(201);
    expect(response.body.coachId).toBe(coachId);
    expect(response.body.status).toBe("OPEN");
  });

  it("should reject students", async () => {
    const response = await request(app)
      .post("/availability")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        startAt: "2026-11-25T15:00:00.000Z",
        durationMinutes: 30,
      });

    expect(response.status).toBe(403);
  });

  it("should reject unauthenticated requests", async () => {
    const response = await request(app)
      .post("/availability")
      .send({
        startAt: "2026-11-25T16:00:00.000Z",
        durationMinutes: 30,
      });

    expect(response.status).toBe(401);
  });

  it("should reject invalid availability data", async () => {
    const response = await request(app)
      .post("/availability")
      .set("Authorization", `Bearer ${coachToken}`)
      .send({
        startAt: "not-a-date",
        durationMinutes: 45,
      });

    expect(response.status).toBe(400);
  });
});