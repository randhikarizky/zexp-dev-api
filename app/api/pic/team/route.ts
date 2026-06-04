import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";

export type TeamMember = {
  id: string;
  nama: string;
  nrp: string;
  jabatan: string;
  photoUrl: string | null;
  placement: string;
  shift: {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
  } | null;
  status: "hadir" | "terlambat" | "belum_absen" | "izin" | "sakit" | "alpha";
  checkInTime: string | null;
  checkOutTime: string | null;
};

export function toIsoDateTime(timeStr: string | null | undefined, dateStr: string): string | null {
  if (!timeStr) return null;
  if (timeStr.includes("T")) return timeStr; // Already ISO datetime
  return `${dateStr}T${timeStr}:00.000Z`;
}

export function getUserShift(userId: string, db: any, todayStr: string) {
  // Try today's attendance first
  const todayAttendance = db.attendances.find((a: any) => a.userId === userId && a.date === todayStr);
  let shiftId = todayAttendance?.shiftId;
  
  if (!shiftId) {
    // Try most recent attendance
    const recentAttendance = [...db.attendances]
      .filter((a: any) => a.userId === userId)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))[0];
    shiftId = recentAttendance?.shiftId;
  }
  
  if (!shiftId) {
    shiftId = "shift-a"; // Default shift fallback
  }
  
  const shift = db.shifts.find((s: any) => s.id === shiftId);
  if (!shift) return null;
  
  return {
    id: shift.id,
    label: shift.label || shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
  };
}

export async function GET(request: NextRequest) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const db = readDb();
  const siteId = supervisor.siteId;

  // Filter users at the same site, excluding the supervisor
  const siteUsers = db.users.filter((u) => u.siteId === siteId && u.id !== supervisor.id);

  const todayStr = new Date().toISOString().split("T")[0];

  const team: TeamMember[] = siteUsers.map((user) => {
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

    return {
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
  });

  return jsonResponse(team, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
