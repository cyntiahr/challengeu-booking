import bcrypt from "bcryptjs";
import { enrollmentProvider } from "./prisma-enrollment.provider.js";

export async function registerStudent(input: {
  email: string;
  name: string;
  password: string;
  timeZone: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return enrollmentProvider.registerStudent({
    email: input.email,
    name: input.name,
    passwordHash,
    timeZone: input.timeZone,
  });
}

export async function updateStudentStatus(
  studentId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  return enrollmentProvider.updateStudentStatus(studentId, status);
}