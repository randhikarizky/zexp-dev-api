import { NextRequest } from "next/server";
import { readDb } from "./db";
import { jsonResponse } from "./cors";

export type AuthResult = {
  user: any | null;
  errorResponse?: Response;
};

export function getAuthenticatedUser(request: NextRequest): any | null {
  const db = readDb();
  
  // 1. Try Authorization header
  const authHeader = request.headers.get("Authorization");
  let userId: string | null = null;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token.startsWith("mock_jwt_")) {
      const parts = token.split("_");
      // parts: ["mock", "jwt", "USR-001", "171754..."]
      if (parts.length >= 3) {
        userId = parts[2];
      }
    } else {
      userId = token;
    }
  }
  
  // 2. Try query parameter (fallback)
  if (!userId) {
    userId = request.nextUrl.searchParams.get("userId");
  }

  // 3. Try custom header (fallback)
  if (!userId) {
    userId = request.headers.get("x-user-id");
  }
  
  // Find user in database
  const user = db.users.find((u) => u.id === userId);
  
  // Fallback to USR-001 (Randhika, the Supervisor) in development/mock if no user identified
  if (!user && db.users.length > 0) {
    return db.users.find((u) => u.id === "USR-001") || db.users[0];
  }
  
  return user || null;
}

export function checkAuthAndRole(request: NextRequest): AuthResult {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return {
      user: null,
      errorResponse: jsonResponse({ message: "Unauthorized. Token tidak valid atau tidak ditemukan." }, 401)
    };
  }

  const allowedRoles = ["Supervisor", "PIC", "Danru", "Leader"];
  const isAllowed = allowedRoles.some(
    (role) => user.jabatan.toLowerCase().includes(role.toLowerCase())
  );

  if (!isAllowed) {
    return {
      user,
      errorResponse: jsonResponse({ message: "Forbidden. Peran tidak diizinkan." }, 403)
    };
  }

  return { user };
}
