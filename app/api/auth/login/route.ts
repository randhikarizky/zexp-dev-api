import { NextRequest } from "next/server";

import { jsonResponse, emptyResponse } from "@/lib/cors";
import { readDb } from "@/lib/db";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  let body: LoginBody = {};
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    body = {};
  }

  const { email, password } = body;
  const db = readDb();
  const user = db.users.find((item) => item.email === email);

  if (!user || !password || password.length < 6) {
    return jsonResponse({ message: "Email atau password tidak sesuai." }, 401);
  }

  return jsonResponse(
    {
      token: `mock_jwt_${Date.now()}`,
      user,
    },
    200,
  );
}

export function OPTIONS() {
  return emptyResponse();
}
