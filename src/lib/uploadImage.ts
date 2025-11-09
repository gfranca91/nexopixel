import sharp from "sharp";
import { supabaseAdmin } from "./supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function uploadAndProcessImage(
  source: string | Buffer,
  bucketName: string = "post-images"
): Promise<string | null> {
  if (!source) {
    console.warn("Fonte da imagem não fornecida para processamento.");
    return null;
  }

  let imageBuffer: Buffer;

  try {
    if (typeof source === "string") {
      const response = await fetch(source);
      if (!response.ok) {
        console.error(
          `Falha ao baixar imagem: ${source}, Status: ${response.status}`
        );
        return null;
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      imageBuffer = source;
    }

    const processedImageBuffer = await sharp(imageBuffer)
      .resize({
        width: 1080,
        height: 1080,
        fit: sharp.fit.cover,
        position: sharp.strategy.attention,
      })
      .jpeg({ quality: 75, progressive: true })
      .toBuffer();

    const fileName = `${uuidv4()}.jpeg`;
    const filePath = `processed/${fileName}`;

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, processedImageBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Erro no upload para o Supabase Storage:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (publicUrlData) {
      return publicUrlData.publicUrl;
    }

    return null;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no processamento da imagem:", errorMessage);
    return null;
  }
}
