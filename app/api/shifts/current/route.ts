import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

export async function GET() {
  const db = readDb();
  const currentShift = db.shifts[1] ?? db.shifts[0];

  if (!currentShift) {
    return jsonResponse(null, 200);
  }

  return jsonResponse(
    {
      ...currentShift,
      name: currentShift.name ?? currentShift.label,
    },
    200,
  );
}

export function OPTIONS() {
  return emptyResponse();
}
