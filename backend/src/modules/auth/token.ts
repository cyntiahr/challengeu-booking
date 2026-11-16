
import jwt, { type JwtPayload } from "jsonwebtoken";

export type UserRole = "STUDENT" | "COACH" | "ADMIN";

export interface AuthTokenPayload extends JwtPayload {
  role: UserRole;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing");
  }

  return secret;
}

export function generateToken(
  userId: string,
  role: UserRole
): string {
  return jwt.sign(
    { role },
    getJwtSecret(),
    {
      subject: userId,
      expiresIn: "1h",
    }
  );
}

export function verifyToken(
  token: string
): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !["STUDENT", "COACH", "ADMIN"].includes(decoded.role as string)
    ) {
      return null;
    }

    return decoded as AuthTokenPayload;
  } catch {
    return null;
  }
}
