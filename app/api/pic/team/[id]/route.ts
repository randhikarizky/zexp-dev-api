import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";
import { TeamMember, toIsoDateTime, getUserShift } from "../route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const db = readDb();

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return jsonResponse({ message: "Anggota tim tidak ditemukan." }, 404);
  }

  // Ensure this member belongs to the supervisor's site
  if (user.siteId !== supervisor.siteId) {
    return jsonResponse({ message: "Forbidden. Anggota tim berada di site berbeda." }, 403);
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const profile = db.profile?.find((p) => p.id === user.id);
  const todayAttendance = db.attendances.find(
    (a) => a.userId === user.id && a.date === todayStr
  );

  let status: TeamMember["status"] = "belum_absen";
  let checkInTime: string | null = null;
  let checkOutTime: string | null = null;

  if (todayAttendance) {
    if (todayAttendance.status === "hadir") {
      status = "hadir";
    } else if (todayAttendance.status === "terlambat") {
      status = "terlambat";
    } else if (todayAttendance.status === "izin") {
      status = "izin";
    } else if (todayAttendance.status === "sakit") {
      status = "sakit";
    } else if (todayAttendance.status === "alpha") {
      status = "alpha";
    }
    
    checkInTime = toIsoDateTime(todayAttendance.checkIn, todayStr);
    checkOutTime = toIsoDateTime(todayAttendance.checkOut, todayStr);
  }

  const shift = getUserShift(user.id, db, todayStr);

  const teamMember: TeamMember = {
    id: user.id,
    nama: user.nama,
    nrp: profile?.employeeNumber || `NRP-${user.id.split("-")[1] || "000"}`,
    jabatan: user.jabatan,
    photoUrl: profile?.photoUrl || null,
    placement: `${user.site || ""} - ${user.pos || ""}`,
    shift,
    status,
    checkInTime,
    checkOutTime,
  };

  return jsonResponse(teamMember, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
