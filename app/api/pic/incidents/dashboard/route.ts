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

  // Get incidents from site users
  const incidents = (db.incidents || []).filter((i) => siteUserIds.includes(i.userId));

  const summary = {
    open: incidents.filter((i) => i.status === "open").length,
    investigating: incidents.filter((i) => i.status === "investigating").length,
    closed: incidents.filter((i) => i.status === "closed").length,
  };

  return jsonResponse(summary, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
