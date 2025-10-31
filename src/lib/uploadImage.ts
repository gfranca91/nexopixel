import sharp from "sharp";
import { supabaseAdmin } from "./supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function uploadAndProcessImage(
  imageUrl: string,
  bucketName: string = "post-images"
): Promise<string | null> {
  if (!imageUrl) {
    console.warn("URL da imagem não fornecida para processamento.");
    return null;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(
        `Falha ao baixar imagem: ${imageUrl}, Status: ${response.status}`
      );
      return null;
    }
    const imageBuffer = await response.arrayBuffer();

    const processedImageBuffer = await sharp(Buffer.from(imageBuffer))
      .resize({
        width: 1080,
        height: 1080,
        fit: sharp.fit.cover,
        position: sharp.strategy.attention,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const fileName = `${uuidv4()}.jpeg`;
    const filePath = `processed/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
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
