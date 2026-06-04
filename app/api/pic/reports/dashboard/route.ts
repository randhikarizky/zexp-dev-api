import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const db = readDb();
  const siteId = supervisor.siteId;

  // Filter users at the same site
  const siteUsers = db.users.filter((u) => u.siteId === siteId);
  const siteUserIds = siteUsers.map((u) => u.id);

  // Get reports from site users
  const reports = db.reports.filter((r) => siteUserIds.includes(r.userId));

  const summary = {
    pengecekan: reports.filter((r) => r.type === "pengecekan").length,
    visit: reports.filter((r) => r.type === "visit").length,
    kinerja: reports.filter((r) => r.type === "kinerja" || r.type === "harian").length,
    insidentil: reports.filter((r) => r.type === "insidentil").length,
    k3: reports.filter((r) => r.type === "k3").length,
  };

  return jsonResponse(summary, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
