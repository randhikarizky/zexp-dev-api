import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = readDb();
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");

  let results = db.attendances;

  if (userId) {
    results = results.filter((item) => item.userId === userId);
  }

  if (date) {
    results = results.filter((item) => item.date === date);
  }

  return jsonResponse(results, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
