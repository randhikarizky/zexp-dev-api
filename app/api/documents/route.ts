import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = readDb();
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return jsonResponse({ message: "userId diperlukan." }, 400);
  }

  const docs = db.documents?.filter((d) => d.userId === userId) ?? [];

  return jsonResponse(docs, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
