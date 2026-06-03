import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb, writeDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = readDb();
  const userId = request.nextUrl.searchParams.get("userId");

  let results = db.incidents || [];
  if (userId) {
    results = results.filter((item: any) => item.userId === userId);
  }

  // Sort by createdAt desc
  results = [...results].sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return jsonResponse(results, 200);
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const db = readDb();
  if (!db.incidents) {
    db.incidents = [];
  }

  const newIncident = {
    id: body.id || `INC-${Date.now()}`,
    userId: body.userId || "USR-001",
    status: body.status || "pending_review",
    createdAt: new Date().toISOString(),
    timeline: body.timeline || [
      {
        status: body.status || "pending_review",
        notes: "Laporan insiden berhasil dikirim oleh petugas.",
        updatedAt: new Date().toISOString(),
        updatedBy: body.makerName || "System",
      }
    ],
    ...body,
  };

  db.incidents.push(newIncident);
  writeDb(db);

  return jsonResponse(
    { message: "Laporan insiden berhasil dikirim", data: newIncident },
    201
  );
}

export function OPTIONS() {
  return emptyResponse();
}
