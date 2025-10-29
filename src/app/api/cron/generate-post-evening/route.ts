import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  console.log("EXECUTANDO CRON DA TARDE (20:00 UTC / 17:00 BSB)");

  return NextResponse.json({
    ok: true,
    message: "Cron da tarde executado com sucesso.",
  });
}
