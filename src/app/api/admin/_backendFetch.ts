import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function adminBackendGet(path: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      "x-user-id": userId,
    },
    cache: "no-store",
  });

  const body = await safeJson(res);
  if (!res.ok) {
    return NextResponse.json(
      { error: body?.error || body?.message || "Backend request failed" },
      { status: res.status }
    );
  }

  return NextResponse.json(body ?? null, { status: 200 });
}

