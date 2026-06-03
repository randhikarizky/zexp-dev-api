import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb, writeDb } from "@/lib/db";

type ReportBody = {
  type?: string;
  title?: string;
  notes?: string;
  date?: string;
  shiftId?: string;
  [key: string]: unknown;
};

export async function GET(request: NextRequest) {
  const db = readDb();
  const userId = request.nextUrl.searchParams.get("userId");

  let results = db.reports;
  if (userId) {
    results = results.filter((item) => item.userId === userId);
  }

  results = results.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return jsonResponse(results, 200);
}

export async function POST(request: NextRequest) {
  let body: ReportBody = {};
  try {
    body = (await request.json()) as ReportBody;
  } catch {
    body = {};
  }

  const { type, title, notes, date, shiftId, ...rest } = body;
  const db = readDb();
  const newReport = {
    id: `RPT-${Date.now()}`,
    userId: "USR-001",
    status: "submitted",
    createdAt: new Date().toISOString(),
    type: type ?? "",
    title: title ?? "",
    notes,
    date: date ?? "",
    shiftId: shiftId ?? "",
    ...rest,
  };

  db.reports.push(newReport);
  writeDb(db);

  return jsonResponse(
    { message: "Laporan berhasil dikirim", data: newReport },
    201,
  );
}

export function OPTIONS() {
  return emptyResponse();
}
