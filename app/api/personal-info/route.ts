import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = readDb();
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return jsonResponse({ message: "userId diperlukan." }, 400);
  }

  const info = db.personalInfo?.find((p) => p.userId === userId) ?? null;

  if (!info) {
    return jsonResponse({ message: "Data pribadi tidak ditemukan." }, 404);
  }

  return jsonResponse(info, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
