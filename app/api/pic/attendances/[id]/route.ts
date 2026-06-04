import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";
import { toIsoDateTime } from "../../team/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const db = readDb();

  const attendance = db.attendances.find((a) => a.id === id);
  if (!attendance) {
    return jsonResponse({ message: "Absensi tidak ditemukan." }, 404);
  }

  // Ensure the user of the attendance record belongs to the supervisor's site
  const employee = db.users.find((u) => u.id === attendance.userId);
  if (!employee || employee.siteId !== supervisor.siteId) {
    return jsonResponse({ message: "Forbidden. Data absensi berada di site berbeda." }, 403);
  }

  const record = {
    id: attendance.id,
    userId: attendance.userId,
    userName: employee.nama,
    nrp: db.profile?.find((p) => p.id === employee.id)?.employeeNumber || "",
    date: attendance.date,
    checkIn: toIsoDateTime(attendance.checkIn, attendance.date),
    checkOut: toIsoDateTime(attendance.checkOut, attendance.date),
    status: attendance.status,
    location: attendance.lat && attendance.lng ? {
      lat: attendance.lat,
      lng: attendance.lng,
      address: employee.pos || "Pos Utama",
    } : null,
    photoUrl: attendance.photoUrl || null,
    checkOutPhotoUrl: attendance.checkOutPhotoUrl || null,
  };

  return jsonResponse(record, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
