import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = readDb();
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return jsonResponse({ message: "userId diperlukan." }, 400);
  }

  const training = db.training?.find((t) => t.userId === userId) ?? null;

  if (!training) {
    return jsonResponse({ message: "Data pelatihan tidak ditemukan." }, 404);
  }

  return jsonResponse(training, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
