import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const db = readDb();
  const siteId = supervisor.siteId;

  // Filter users at the same site, excluding the supervisor
  const siteUsers = db.users.filter((u) => u.siteId === siteId);
  const siteUserIds = siteUsers.map((u) => u.id);
  const totalPersonnel = siteUsers.filter((u) => u.id !== supervisor.id).length;

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter attendances for today and users of this site
  const attendancesToday = db.attendances.filter(
    (a) => siteUserIds.includes(a.userId) && a.date === todayStr
  );
  
  const presentToday = attendancesToday.filter(
    (a) => a.status === "hadir" || a.status === "terlambat"
  ).length;
  
  const notCheckedIn = totalPersonnel - presentToday;
  
  const notCheckedOut = attendancesToday.filter(
    (a) => a.checkIn && !a.checkOut
  ).length;

  // Active incidents (status !== 'closed')
  const activeIncidents = (db.incidents || []).filter(
    (i) => siteUserIds.includes(i.userId) && i.status !== "closed"
  ).length;

  // Reports today
  const reportsToday = (db.reports || []).filter(
    (r) => siteUserIds.includes(r.userId) && r.date === todayStr
  ).length;

  return jsonResponse({
    totalPersonnel,
    presentToday,
    notCheckedIn: Math.max(0, notCheckedIn),
    notCheckedOut,
    activeIncidents,
    reportsToday,
  }, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
