import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb, writeDb } from "@/lib/db";

type CheckOutBody = {
  attendanceId?: string;
  lat?: number;
  lng?: number;
  photoUrl?: string;
};

export async function POST(request: NextRequest) {
  let body: CheckOutBody = {};
  try {
    body = (await request.json()) as CheckOutBody;
  } catch {
    body = {};
  }

  const db = readDb();
  const recordIndex = db.attendances.findIndex(
    (item) => item.id === body.attendanceId,
  );

  if (recordIndex !== -1) {
    db.attendances[recordIndex] = {
      ...db.attendances[recordIndex],
      checkOut: new Date().toISOString(),
      checkOutPhotoUrl: body.photoUrl || null,
    };
    writeDb(db);
  }

  return jsonResponse({ message: "Check-out berhasil" }, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
