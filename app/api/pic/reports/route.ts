import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";

export type PicReportRecord = {
  id: string;
  userId: string;
  userName: string;
  type: "pengecekan" | "visit" | "kinerja" | "insidentil" | "k3";
  title: string;
  status: "submitted" | "pending" | "draft";
  createdAt: string; // ISO datetime
  notes?: string;
  photos?: string[];
  lat?: number;
  lng?: number;
  shiftId?: string;
};

export async function GET(request: NextRequest) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const db = readDb();
  const siteId = supervisor.siteId;

  // Filter users at the same site, including the supervisor
  const siteUsers = db.users.filter((u) => u.siteId === siteId);
  const siteUserIds = siteUsers.map((u) => u.id);

  const searchParams = request.nextUrl.searchParams;
  const typeFilter = searchParams.get("type");
  const userIdFilter = searchParams.get("userId");

  // Get reports from site users
  let reports = db.reports.filter((r) => siteUserIds.includes(r.userId));

  // Filter by type
  if (typeFilter && typeFilter !== "semua") {
    reports = reports.filter((r) => r.type === typeFilter);
  }

  // Filter by userId
  if (userIdFilter && userIdFilter !== "semua") {
    reports = reports.filter((r) => r.userId === userIdFilter);
  }

  // Map to PicReportRecord
  const records: PicReportRecord[] = reports.map((r) => {
    const user = siteUsers.find((u) => u.id === r.userId);
    return {
      id: r.id,
      userId: r.userId,
      userName: user?.nama || "Unknown",
      type: r.type as PicReportRecord["type"],
      title: r.title,
      status: (r.status as PicReportRecord["status"]) || "submitted",
      createdAt: r.createdAt || new Date(r.date).toISOString(),
      notes: r.notes,
      photos: (r.photos as string[]) || [],
      lat: r.lat as number,
      lng: r.lng as number,
      shiftId: r.shiftId,
    };
  });

  // Sort by createdAt desc
  records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return jsonResponse(records, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
