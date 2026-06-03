import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = readDb();
  const site = db.sites.find((item) => item.id === id);

  if (!site) {
    return jsonResponse({ message: "Site tidak ditemukan." }, 404);
  }

  return jsonResponse(site, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
