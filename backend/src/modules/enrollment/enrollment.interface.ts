export interface EnrollmentProvider {
  getStudentStatus(
    studentId: string,
  ): Promise<"ACTIVE" | "SUSPENDED" | null>;

  registerStudent(input: {
    email: string;
    name: string;
    passwordHash: string;
    timeZone: string;
  }): Promise<{ id: string }>;

  updateStudentStatus(
    studentId: string,
    status: "ACTIVE" | "SUSPENDED",
  ): Promise<void>;
}