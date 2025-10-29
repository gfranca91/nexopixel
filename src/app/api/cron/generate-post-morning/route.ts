import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  console.log("EXECUTANDO CRON DA MANHÃ (09:00 UTC / 06:00 BSB)");

  return NextResponse.json({
    ok: true,
    message: "Cron da manhã executado com sucesso.",
  });
}
