import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { statuses } = await req.json();
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Inicializar Supabase (Edge Runtime)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Upsert de todos os campos obrigatórios
  const { error } = await supabase
    .from("statuses")
    .upsert(statuses, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 