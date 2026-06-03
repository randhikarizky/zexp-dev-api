import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb, writeDb } from "@/lib/db";

type UpdateBody = {
  phone?: string;
  email?: string;
  address?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: UpdateBody = {};
  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    body = {};
  }

  const db = readDb();
  const index = db.personalInfo?.findIndex((p) => p.id === id) ?? -1;

  if (index === -1) {
    return jsonResponse({ message: "Data pribadi tidak ditemukan." }, 404);
  }

  const allowedKeys: (keyof UpdateBody)[] = ["phone", "email", "address"];
  const updated = { ...db.personalInfo[index] };

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      (updated as Record<string, unknown>)[key] = body[key];
    }
  }

  db.personalInfo[index] = updated;
  writeDb(db);

  return jsonResponse(
    { message: "Data berhasil diperbarui.", data: updated },
    200,
  );
}

export function OPTIONS() {
  return emptyResponse();
}
