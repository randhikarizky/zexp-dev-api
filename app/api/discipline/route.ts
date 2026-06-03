import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = readDb();
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return jsonResponse({ message: "userId diperlukan." }, 400);
  }

  const discipline = db.discipline?.find((d) => d.userId === userId) ?? null;

  if (!discipline) {
    return jsonResponse({ message: "Data disiplin & penghargaan tidak ditemukan." }, 404);
  }

  return jsonResponse(discipline, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
