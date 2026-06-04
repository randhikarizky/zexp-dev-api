import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb, writeDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";
import { PicIncidentRecord } from "../route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const db = readDb();

  const incident = (db.incidents || []).find((i) => i.id === id);
  if (!incident) {
    return jsonResponse({ message: "Insiden tidak ditemukan." }, 404);
  }

  // Verify that the incident's reporter belongs to the supervisor's site
  const reporter = db.users.find((u) => u.id === incident.userId);
  if (!reporter || reporter.siteId !== supervisor.siteId) {
    return jsonResponse({ message: "Forbidden. Insiden berada di site berbeda." }, 403);
  }

  const record: PicIncidentRecord = {
    id: incident.id,
    userId: incident.userId,
    userName: reporter.nama || "Unknown",
    type: incident.type as PicIncidentRecord["type"],
    title: incident.title,
    status: (incident.status as PicIncidentRecord["status"]) || "open",
    createdAt: incident.createdAt || new Date(incident.date).toISOString(),
    location: incident.location || "Lokasi tidak ditentukan",
    description: (incident.chronological || incident.description || "") as string,
    photos: (incident.photos as string[]) || [],
    lat: incident.lat as number,
    lng: incident.lng as number,
    investigationNotes: (incident.investigationNotes as string) || "",
    followUpAction: (incident.followUpAction as string) || "",
  };

  return jsonResponse(record, 200);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: "Request body tidak valid." }, 400);
  }

  const { status, investigationNotes, followUpAction } = body;

  if (!status || !["open", "investigating", "closed"].includes(status)) {
    return jsonResponse({ message: "Status tidak valid." }, 400);
  }

  const db = readDb();
  const incidents = db.incidents || [];
  const idx = incidents.findIndex((i) => i.id === id);

  if (idx === -1) {
    return jsonResponse({ message: "Insiden tidak ditemukan." }, 404);
  }

  const incident = incidents[idx];

  // Verify that the incident's reporter belongs to the supervisor's site
  const reporter = db.users.find((u) => u.id === incident.userId);
  if (!reporter || reporter.siteId !== supervisor.siteId) {
    return jsonResponse({ message: "Forbidden. Insiden berada di site berbeda." }, 403);
  }

  // Update fields
  incident.status = status;
  incident.investigationNotes = investigationNotes || "";
  incident.followUpAction = followUpAction || "";

  // Update timeline if exists
  if (!incident.timeline) {
    incident.timeline = [];
  }
  
  incident.timeline.push({
    status: status,
    notes: `Tindak lanjut oleh supervisor: ${investigationNotes || "-"} (Tindakan: ${followUpAction || "-"})`,
    updatedAt: new Date().toISOString(),
    updatedBy: supervisor.nama,
  });

  db.incidents[idx] = incident;
  writeDb(db);

  const record: PicIncidentRecord = {
    id: incident.id,
    userId: incident.userId,
    userName: reporter.nama || "Unknown",
    type: incident.type as PicIncidentRecord["type"],
    title: incident.title,
    status: (incident.status as PicIncidentRecord["status"]) || "open",
    createdAt: incident.createdAt || new Date(incident.date).toISOString(),
    location: incident.location || "Lokasi tidak ditentukan",
    description: (incident.chronological || incident.description || "") as string,
    photos: (incident.photos as string[]) || [],
    lat: incident.lat as number,
    lng: incident.lng as number,
    investigationNotes: (incident.investigationNotes as string) || "",
    followUpAction: (incident.followUpAction as string) || "",
  };

  return jsonResponse(record, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
