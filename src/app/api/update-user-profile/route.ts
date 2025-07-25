export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(
    "https://waqbekhjnlwqmbygkipv.supabase.co/functions/v1/update-user-profile",
    {
      method: "POST",
      headers: {
        "Authorization": req.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body,
    }
  );
  const data = await res.text();
  return new Response(data, { status: res.status, headers: { "Content-Type": "application/json" } });
} 