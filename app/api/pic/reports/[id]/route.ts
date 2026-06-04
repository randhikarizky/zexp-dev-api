import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const db = readDb();

  const report = db.reports.find((r) => r.id === id);
  if (!report) {
    return jsonResponse({ message: "Laporan tidak ditemukan." }, 404);
  }

  // Ensure the author belongs to the supervisor's site
  const employee = db.users.find((u) => u.id === report.userId);
  if (!employee || employee.siteId !== supervisor.siteId) {
    return jsonResponse({ message: "Forbidden. Data laporan berada di site berbeda." }, 403);
  }

  const record = {
    id: report.id,
    userId: report.userId,
    userName: employee.nama,
    type: report.type,
    title: report.title,
    status: report.status || "submitted",
    createdAt: report.createdAt || new Date(report.date).toISOString(),
    notes: report.notes,
    photos: (report.photos as string[]) || [],
    lat: report.lat as number,
    lng: report.lng as number,
    shiftId: report.shiftId,
  };

  return jsonResponse(record, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
