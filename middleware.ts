import { NextRequest, NextResponse } from "next/server";

type JwtPayload = {
    exp?: number;
    role?: string;
    [key: string]: unknown;
};

const JWT_SECRET = process.env.JWT_SECRET || "not-so-secret-dev-key";
const PUBLIC_PATHS = new Set([
    "/",
    "/login",
    "/register",
    "/privacy",
    "/terms",
    "/admin-login",
]);
const PUBLIC_PREFIXES = [
    "/reset-password",
];

function isPublicPath(pathname: string) {
    if (PUBLIC_PATHS.has(pathname)) {
        return true;
    }

    return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function buildLoginRedirect(req: NextRequest) {
    const loginUrl = new URL("/login", req.url);
    const requestedPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", requestedPath);
    return loginUrl;
}

function buildAdminLoginRedirect(req: NextRequest) {
    const loginUrl = new URL("/admin-login", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return loginUrl;
}

function decodeBase64Url(value: string) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return atob(padded);
}

function decodeBase64UrlToBytes(value: string) {
    const decoded = decodeBase64Url(value);
    return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

async function verifyJwt(token?: string | null): Promise<JwtPayload | null> {
    if (!token) {
        return null;
    }

    const segments = token.split(".");
    if (segments.length !== 3) {
        return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = segments;

    try {
        const header = JSON.parse(decodeBase64Url(encodedHeader)) as { alg?: string };
        if (header.alg !== "HS256") {
            return null;
        }

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(JWT_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"],
        );

        const verified = await crypto.subtle.verify(
            "HMAC",
            key,
            decodeBase64UrlToBytes(encodedSignature),
            new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
        );

        if (!verified) {
            return null;
        }

        const payload = JSON.parse(decodeBase64Url(encodedPayload)) as JwtPayload;
        if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

function withDeletedCookieRedirect(
    redirectUrl: URL,
    cookieName: "auth_token" | "admin_token",
) {
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(cookieName);
    return response;
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin-dashboard")) {
        const adminToken = req.cookies.get("admin_token")?.value;
        const adminPayload = await verifyJwt(adminToken);

        if (!adminPayload || adminPayload.role !== "admin") {
            return withDeletedCookieRedirect(buildAdminLoginRedirect(req), "admin_token");
        }

        return NextResponse.next();
    }

    if (pathname === "/admin-login") {
        const adminToken = req.cookies.get("admin_token")?.value;
        const adminPayload = await verifyJwt(adminToken);

        if (adminPayload?.role === "admin") {
            return NextResponse.redirect(new URL("/admin-dashboard", req.url));
        }

        if (adminToken) {
            return withDeletedCookieRedirect(new URL("/admin-login", req.url), "admin_token");
        }
    }

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const authToken = req.cookies.get("auth_token")?.value;
    const authPayload = await verifyJwt(authToken);

    if (!authPayload) {
        return withDeletedCookieRedirect(buildLoginRedirect(req), "auth_token");
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
};
