import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = readDb();
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return jsonResponse({ message: "userId diperlukan." }, 400);
  }

  const profile = db.profile?.find((p) => p.id === userId) ?? null;

  if (!profile) {
    return jsonResponse({ message: "Profil tidak ditemukan." }, 404);
  }

  return jsonResponse(profile, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
