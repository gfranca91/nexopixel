import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { uploadAndProcessImage } from "../../../../lib/uploadImage";

export async function POST(request: Request) {
  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let fileBuffer: Buffer;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    fileBuffer = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    console.error("Erro ao processar FormData:", e);
    return NextResponse.json(
      { error: "Falha ao ler o arquivo" },
      { status: 400 }
    );
  }

  try {
    const publicUrl = await uploadAndProcessImage(fileBuffer);

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Falha ao processar e salvar a imagem" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl: publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Erro no uploadAndProcessImage:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
