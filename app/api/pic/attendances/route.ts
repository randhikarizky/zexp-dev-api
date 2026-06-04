import { NextRequest } from "next/server";
import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";
import { checkAuthAndRole } from "@/lib/auth";
import { toIsoDateTime } from "../team/route";

export type PicAttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  nrp: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "hadir" | "terlambat" | "belum_absen" | "izin" | "sakit";
  location: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  photoUrl?: string | null;
  checkOutPhotoUrl?: string | null;
};

export async function GET(request: NextRequest) {
  const { user: supervisor, errorResponse } = checkAuthAndRole(request);
  if (errorResponse) return errorResponse;

  const db = readDb();
  const siteId = supervisor.siteId;

  // Filter users at the same site, excluding the supervisor
  const siteUsers = db.users.filter((u) => u.siteId === siteId && u.id !== supervisor.id);

  const todayStr = new Date().toISOString().split("T")[0];

  const searchParams = request.nextUrl.searchParams;
  const statusFilter = searchParams.get("status") || "semua"; // "hadir" | "terlambat" | "belum_check_in" | "belum_check_out" | "semua"

  // Build the list of records for all team members
  let records: PicAttendanceRecord[] = siteUsers.map((user) => {
    const profile = db.profile?.find((p) => p.id === user.id);
    const attendance = db.attendances.find(
      (a) => a.userId === user.id && a.date === todayStr
    );

    let status: PicAttendanceRecord["status"] = "belum_absen";
    let checkIn: string | null = null;
    let checkOut: string | null = null;
    let location: PicAttendanceRecord["location"] = null;
    let photoUrl: string | null = null;
    let checkOutPhotoUrl: string | null = null;

    if (attendance) {
      if (attendance.status === "hadir") {
        status = "hadir";
      } else if (attendance.status === "terlambat") {
        status = "terlambat";
      } else if (attendance.status === "izin") {
        status = "izin";
      } else if (attendance.status === "sakit") {
        status = "sakit";
      }

      checkIn = toIsoDateTime(attendance.checkIn, todayStr);
      checkOut = toIsoDateTime(attendance.checkOut, todayStr);
      
      if (attendance.lat && attendance.lng) {
        location = {
          lat: attendance.lat,
          lng: attendance.lng,
          address: user.pos || "Pos Utama",
        };
      }
      photoUrl = attendance.photoUrl || null;
      checkOutPhotoUrl = attendance.checkOutPhotoUrl || null;
    }

    return {
      id: attendance?.id || `ATD-MOCK-${user.id}-${todayStr}`,
      userId: user.id,
      userName: user.nama,
      nrp: profile?.employeeNumber || `NRP-${user.id.split("-")[1] || "000"}`,
      date: todayStr,
      checkIn,
      checkOut,
      status,
      location,
      photoUrl,
      checkOutPhotoUrl,
    };
  });

  // Apply filters
  if (statusFilter !== "semua") {
    if (statusFilter === "hadir") {
      records = records.filter((r) => r.status === "hadir");
    } else if (statusFilter === "terlambat") {
      records = records.filter((r) => r.status === "terlambat");
    } else if (statusFilter === "belum_check_in") {
      records = records.filter((r) => r.status === "belum_absen");
    } else if (statusFilter === "belum_check_out") {
      records = records.filter((r) => r.checkIn && !r.checkOut);
    }
  }

  return jsonResponse(records, 200);
}

export function OPTIONS() {
  return emptyResponse();
}
