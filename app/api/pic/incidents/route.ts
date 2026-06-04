import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";

export type PicIncidentRecord = {
  id: string;
  userId: string;
  userName: string;
  type: "near_miss" | "work_accident";
  title: string;
  status: "open" | "investigating" | "closed";
  createdAt: string; // ISO datetime
  location: string;
  description: string;
  photos?: string[];
  lat?: number;
  lng?: number;
  investigationNotes?: string;
  followUpAction?: string;
};

export async function GET(request: NextRequest) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const db = readDb();
  const siteId = supervisor.siteId;

  // Filter users at the same site
  const siteUsers = db.users.filter((u) => u.siteId === siteId);
  const siteUserIds = siteUsers.map((u) => u.id);

  const searchParams = request.nextUrl.searchParams;
  const typeFilter = searchParams.get("type");
  const statusFilter = searchParams.get("status");

  // Get incidents from site users
  let incidents = (db.incidents || []).filter((i) => siteUserIds.includes(i.userId));

  // Filter by type
  if (typeFilter && typeFilter !== "semua") {
    incidents = incidents.filter((i) => i.type === typeFilter);
  }

  // Filter by status
  if (statusFilter && statusFilter !== "semua") {
    incidents = incidents.filter((i) => i.status === statusFilter);
  }

  // Map to PicIncidentRecord
  const records: PicIncidentRecord[] = incidents.map((i) => {
    const user = siteUsers.find((u) => u.id === i.userId);
    return {
      id: i.id,
      userId: i.userId,
      userName: user?.nama || "Unknown",
      type: i.type as PicIncidentRecord["type"],
      title: i.title,
      status: (i.status as PicIncidentRecord["status"]) || "open",
      createdAt: i.createdAt || new Date(i.date).toISOString(),
      location: i.location || "Lokasi tidak ditentukan",
      description: (i.chronological || i.description || "") as string,
      photos: (i.photos as string[]) || [],
      lat: i.lat as number,
      lng: i.lng as number,
      investigationNotes: (i.investigationNotes as string) || "",
      followUpAction: (i.followUpAction as string) || "",
    };
  });

  // Sort by createdAt desc
  records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return jsonResponse(records, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
