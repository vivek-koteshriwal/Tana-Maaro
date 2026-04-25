
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "not-so-secret-dev-key";

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function signToken(payload: object): string {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
}

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (e) {
        return null;
    }
}

export async function verifyAuth(req?: Request) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token) return null;
    return verifyToken(token.value);
}

export async function verifyAdminAuth() {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");

    if (!token) return null;
    const payload = verifyToken(token.value);
    if (!payload || payload.role !== "admin") return null;
    return payload;
}
