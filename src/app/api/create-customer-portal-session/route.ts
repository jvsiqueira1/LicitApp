import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { return_url } = await req.json();
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }
  const res = await fetch(
    "https://waqbekhjnlwqmbygkipv.supabase.co/functions/v1/create-customer-portal-session",
    {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ return_url })
    }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 