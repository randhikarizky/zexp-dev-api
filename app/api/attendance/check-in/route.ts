import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb, writeDb } from "@/lib/db";

type CheckInBody = {
  shiftId?: string;
  lat?: number;
  lng?: number;
  photoUrl?: string;
};

export async function POST(request: NextRequest) {
  let body: CheckInBody = {};
  try {
    body = (await request.json()) as CheckInBody;
  } catch {
    body = {};
  }

  const now = new Date();
  const db = readDb();
  const userId = "USR-001";

  const newRecord = {
    id: `ATD-${Date.now()}`,
    userId,
    date: now.toISOString().split("T")[0],
    shiftId: body.shiftId ?? "",
    checkIn: now.toISOString(),
    checkOut: null,
    status: "hadir",
    lat: body.lat ?? 0,
    lng: body.lng ?? 0,
    photoUrl: body.photoUrl,
  };

  db.attendances.push(newRecord);
  writeDb(db);

  return jsonResponse({ message: "Check-in berhasil", data: newRecord }, 201);
}

export function OPTIONS() {
  return emptyResponse();
}
